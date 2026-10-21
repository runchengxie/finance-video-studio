import {open} from 'node:fs/promises';
import path from 'node:path';
import {mediaTool} from './media.js';
import type {Stage} from './stages.js';
export const productionColors={colorRange:'tv',colorSpace:'bt709',colorTransfer:'bt709',colorPrimaries:'bt709'} as const;
export type Background={file:string;frames:number;format:'mov'|'matroska'};
function backgroundArgs(background:Pick<Background,'file'|'format'>):string[]{return ['-protocol_whitelist','file','-f',background.format,...(background.format==='mov'?['-enable_drefs','0','-use_absolute_path','0']:[]),'-i',background.file];}
export async function inspectBackground(file:string):Promise<Background>{
 const ext=path.extname(file).toLowerCase(),handle=await open(file,'r'),header=Buffer.alloc(16);
 try{await handle.read(header,0,16,0);}finally{await handle.close();}
 const format=['.mp4','.mov'].includes(ext)&&header.toString('ascii',4,8)==='ftyp'?'mov':ext==='.webm'&&header.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))?'matroska':null;
 if(!format)throw new Error('background_container');
 const input={file,format} as Pick<Background,'file'|'format'>;
 const result=mediaTool('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,nb_read_frames,duration','-of','json',...backgroundArgs(input)]);
 if(!result.ok)throw new Error('background_probe');
 const s=(JSON.parse(result.stdout) as {streams:{width:number;height:number;r_frame_rate:string;nb_read_frames:string;duration:string}[]}).streams[0];
 const frames=Number(s?.nb_read_frames),duration=Number(s?.duration);
 if(!s||s.width!==1920||s.height!==1080||s.r_frame_rate!=='30/1'||!Number.isInteger(frames)||frames<1||frames>108000||!Number.isFinite(duration)||Math.abs(duration-frames/30)>.04)throw new Error('background_dimensions_or_duration');
 if(!mediaTool('ffmpeg',['-v','error','-xerror',...backgroundArgs(input),'-map','0:v:0','-f','null','-']).ok)throw new Error('background_decode');
 return {file,frames,format};
}
export function encodeStage(stage:Stage,framesDir:string,output:string,crf:number,background?:Background):void {
 const args=['-v','error',...(stage.kind==='hold'?['-loop','1']:[]),'-framerate','30','-i',path.join(framesDir,'%06d.png')];
 if(background){
  // Seek within an indefinitely looped CFR input. Global integer frame phase survives cache cuts.
  args.push('-stream_loop','-1','-ss',String((stage.from%background.frames)/30),...backgroundArgs(background),
   '-filter_complex','[1:v]setpts=PTS-STARTPTS,format=rgba[bg];[0:v]format=rgba[fg];[bg][fg]overlay=shortest=1:format=rgb,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709[v]','-map','[v]');
 }else args.push('-vf','format=rgb24,scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709');
 args.push('-frames:v',String(stage.to-stage.from),'-an','-c:v','libx264','-preset','veryfast','-crf',String(crf),'-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_trc','bt709','-color_primaries','bt709',output);
 const encoded=mediaTool('ffmpeg',args);if(!encoded.ok)throw new Error(`stage_encode_failed:${encoded.stderr.slice(-2000)}`);
}

