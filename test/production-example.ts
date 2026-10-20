import {renderProductionDemo} from '../src/production/demo.js';
const [output,variant='improved']=process.argv.slice(2);if(!output||!['improved','legacy-comparison'].includes(variant))throw new Error('output_and_closed_variant_required');
await renderProductionDemo(output,variant as 'improved'|'legacy-comparison');
