import {readFile} from 'node:fs/promises';
import {schema,csvData} from './core.js';
import {render} from './render.js';
const [input,out,audio,csv]=process.argv.slice(2);
if(!input||!out) throw new Error('Usage: npm run render -- project.json ABSOLUTE_OUTPUT [local-audio] [data.csv]');
const raw:unknown=JSON.parse(await readFile(input,'utf8'));
const p=schema.parse(raw);
if(csv) p.data=csvData(await readFile(csv,'utf8'));
await render(schema.parse(p),out,audio);
