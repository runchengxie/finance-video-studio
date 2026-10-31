import {z} from 'zod';
import {mediaExpectationsSchema} from './verify.js';

const digest=z.string().regex(/^[a-f0-9]{64}$/),time=z.number().finite().nonnegative(),text=z.string().min(1);
const tools=z.object({ffmpeg:text,ffprobe:text}).catchall(z.string());
const interval=z.object({start:z.number().finite().nonnegative(),end:z.number().finite().nonnegative()}).strict();
export const nativeBuildReportSchema=z.object({
 ok:z.literal(true),inputHash:digest,tools:tools.extend({browser:text,font:digest}),
 stages:z.array(z.object({id:text,hit:z.boolean(),reason:text,milliseconds:time}).strict()).min(1),
 milliseconds:time,failure:z.null(),verification:z.object({
  ok:z.literal(true),file:text,sha256:digest,tools,expectations:mediaExpectationsSchema,
  checks:z.array(z.object({name:text,passed:z.literal(true),expected:z.unknown().optional(),actual:z.unknown().optional()}).strict()).min(1),
  scans:z.object({blackEvents:z.array(interval),silenceEvents:z.array(interval),loudness:z.array(z.string())}).strict(),manualListening:z.literal(false)
 }).strict()
}).strict();
