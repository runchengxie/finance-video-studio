import {renderDemo} from './render.js';
const [out,audio]=process.argv.slice(2);
if(!out)throw new Error('Usage: npm run demo -- ABSOLUTE_OUTPUT [licensed-local-audio]');
await renderDemo(out,audio);
