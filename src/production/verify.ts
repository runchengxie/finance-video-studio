import {z} from 'zod';
import {spawnSync} from 'node:child_process';
import {hashFile} from './project-io.js';
import {mediaTool,toolVersion,ToolUnavailableError} from './media.js';

const interval=z.object({start:z.number().finite().nonnegative(),end:z.number().finite().positive()}).strict().refine(x=>x.end>x.start);
export const mediaExpectationsSchema=z.object({colorRange:z.string().max(40).optional(),colorSpace:z.string().max(40).optional(),colorTransfer:z.string().max(40).optional(),colorPrimaries:z.string().max(40).optional(),width:z.number().int().positive().max(8192),height:z.number().int().positive().max(8192),fps:z.number().finite().positive().max(240),frames:z.number().int().positive(),durationSeconds:z.number().finite().positive(),toleranceSeconds:z.number().min(0).max(1).default(.1),videoCodec:z.string().min(1).max(40),pixelFormat:z.string().min(1).max(40),audio:z.object({required:z.boolean(),codec:z.string().max(40).optional(),durationSeconds:z.number().finite().positive().optional()}).strict(),chapters:z.array(z.object({title:z.string(),startFrame:z.number().int().nonnegative(),endFrame:z.number().int().positive()}).strict()).optional(),scans:z.object({black:z.object({minimumSeconds:z.number().positive(),pixelThreshold:z.number().min(0).max(1),pictureThreshold:z.number().min(0).max(1),allowed:z.array(interval)}).strict().optional(),silence:z.object({minimumSeconds:z.number().positive(),noiseDb:z.number().min(-120).max(0),allowed:z.array(interval)}).strict().optional(),loudness:z.boolean().default(false)}).strict().optional()}).strict();
export type MediaExpectations=z.input<typeof mediaExpectationsSchema>;
type Check={name:string;passed:boolean;expected?:unknown;actual?:unknown};
type Interval={start:number;end:number};
export type VerificationReport={ok:boolean;file:string;sha256:string;tools:Record<string,string>;expectations:MediaExpectations;checks:Check[];scans:{blackEvents:Interval[];silenceEvents:Interval[];loudness:string[]};manualListening:false};
function allowed(events:Interval[],ranges:Interval[]):boolean {return events.every(e=>ranges.some(r=>e.start>=r.start-.05&&e.end<=r.end+.05));}
export async function verifyMedia(file:string,expectations:MediaExpectations):Promise<VerificationReport> {
 const expected=mediaExpectationsSchema.parse(expectations),checks:Check[]=[];
 const report:VerificationReport={ok:false,file,sha256:await hashFile(file),tools:{ffmpeg:toolVersion('ffmpeg'),ffprobe:toolVersion('ffprobe')},expectations:expected,checks,scans:{blackEvents:[],silenceEvents:[],loudness:[]},manualListening:false};
 const check=(name:string,passed:boolean,wanted?:unknown,actual?:unknown)=>checks.push({name,passed,expected:wanted,actual});
 const probe=mediaTool('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-show_chapters','-of','json',file]);
 check('probe',probe.ok,undefined,probe.ok?undefined:probe.stderr.slice(-2000));if(!probe.ok)return report;
 const data=JSON.parse(probe.stdout) as {streams:{codec_type:string;codec_name:string;width?:number;height?:number;pix_fmt?:string;color_range?:string;color_space?:string;color_transfer?:string;color_primaries?:string;r_frame_rate?:string;nb_read_frames?:string;duration?:string}[];format:{duration:string};chapters?:{start_time:string;end_time:string;tags?:{title?:string}}[]};
 const v=data.streams.find(s=>s.codec_type==='video'),a=data.streams.find(s=>s.codec_type==='audio');
 check('video_stream',Boolean(v));
 if(v){for(const [key,field] of [['colorRange','color_range'],['colorSpace','color_space'],['colorTransfer','color_transfer'],['colorPrimaries','color_primaries']] as const)if(expected[key])check(field,v[field]===expected[key],expected[key],v[field]);for(const name of ['width','height'] as const)check(name,v[name]===expected[name],expected[name],v[name]);check('video_codec',v.codec_name===expected.videoCodec,expected.videoCodec,v.codec_name);check('pixel_format',v.pix_fmt===expected.pixelFormat,expected.pixelFormat,v.pix_fmt);
  const [n,d]=(v.r_frame_rate??'0/1').split('/').map(Number),fps=n!/(d??1);check('fps',Math.abs(fps-expected.fps)<1e-6,expected.fps,fps);check('frames',Number(v.nb_read_frames)===expected.frames,expected.frames,Number(v.nb_read_frames));check('video_duration',Math.abs(Number(v.duration)-expected.durationSeconds)<=Math.max(expected.toleranceSeconds,1/expected.fps),expected.durationSeconds,v.duration);}
 check('container_duration',Math.abs(Number(data.format.duration)-expected.durationSeconds)<=expected.toleranceSeconds,expected.durationSeconds,data.format.duration);
 check('audio_stream',Boolean(a)===expected.audio.required,expected.audio.required,Boolean(a));if(a&&expected.audio.codec)check('audio_codec',a.codec_name===expected.audio.codec,expected.audio.codec,a.codec_name);if(a){const duration=expected.audio.durationSeconds??expected.durationSeconds;check('audio_duration',Math.abs(Number(a.duration)-duration)<=expected.toleranceSeconds,duration,a.duration);}
 if(expected.chapters){const chapters=data.chapters??[];check('chapter_count',chapters.length===expected.chapters.length,expected.chapters.length,chapters.length);expected.chapters.forEach((c,i)=>{const actual=chapters[i];check(`chapter_${i}`,Boolean(actual)&&actual!.tags?.title===c.title&&Math.abs(Number(actual!.start_time)-c.startFrame/expected.fps)<.01&&Math.abs(Number(actual!.end_time)-c.endFrame/expected.fps)<.01,c,actual);});}
 const decoded=mediaTool('ffmpeg',['-v','error','-xerror','-i',file,'-f','null','-']);check('full_decode',decoded.ok,undefined,decoded.ok?undefined:decoded.stderr.slice(-2000));
 if(expected.scans){
  const filters:string[]=[];const scan=expected.scans;if(scan.silence||scan.loudness)check('audio_scan_available',Boolean(a));
  if(scan.black)filters.push('-vf',`blackdetect=d=${scan.black.minimumSeconds}:pix_th=${scan.black.pixelThreshold}:pic_th=${scan.black.pictureThreshold}`);
  const af=[];if(scan.silence&&a)af.push(`silencedetect=noise=${scan.silence.noiseDb}dB:d=${scan.silence.minimumSeconds}`);if(scan.loudness&&a)af.push('ebur128=peak=true');if(af.length)filters.push('-af',af.join(','));
  const result=spawnSync(process.env.FFMPEG_PATH??'ffmpeg',['-hide_banner','-i',file,...filters,'-f','null','-'],{encoding:'utf8',timeout:300000,maxBuffer:16*1024*1024,windowsHide:true});
  if(result.error)throw new ToolUnavailableError(result.error.message);check('signal_scan',result.status===0);
  const logs=result.stderr??'';report.scans.blackEvents=[...logs.matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m=>({start:Number(m[1]),end:Number(m[2])}));
  let start:number|undefined;for(const line of logs.split(/\r?\n/)){const s=line.match(/silence_start: ([\d.]+)/),e=line.match(/silence_end: ([\d.]+)/);if(s)start=Number(s[1]);if(e&&start!==undefined){report.scans.silenceEvents.push({start,end:Number(e[1])});start=undefined;}}if(start!==undefined)report.scans.silenceEvents.push({start,end:expected.durationSeconds});
  report.scans.loudness=scan.loudness?logs.slice(logs.lastIndexOf('Summary:')).split(/\r?\n/).filter(x=>x.trim()):[];
  if(scan.black)check('black_intervals',allowed(report.scans.blackEvents,scan.black.allowed),scan.black.allowed,report.scans.blackEvents);if(scan.silence)check('silence_intervals',allowed(report.scans.silenceEvents,scan.silence.allowed),scan.silence.allowed,report.scans.silenceEvents);
 }
 report.ok=checks.every(c=>c.passed);return report;
}
