import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schema,csvData,format,srt,html} from '../src/core.js';
const p=schema.parse(JSON.parse(readFileSync('examples/demo.json','utf8')));
test('schema positive and negative fixtures',()=>{
 assert.equal(p.frames,900);
 for(const patch of [{fictional:'true'},{fps:29.97},{frames:90.1},{title:'x'.repeat(29)},{data:[{label:'A',value:NaN}]},{extra:true}]) assert.equal(schema.safeParse({...p,...patch}).success,false);
});
test('CSV strict numeric parsing and JSON parity',()=>{
 assert.deepEqual(csvData(readFileSync('examples/data.csv','utf8')),p.data);
 for(const value of ['', 'Infinity','NaN','-1','12usd']) assert.throws(()=>csvData(`label,value\nA,${value}`));
});
test('unit and rounding boundaries',()=>{
 assert.equal(format(12.25,'USD million'),'12.3M USD');
 assert.equal(format(0,'%'),'0.0%');assert.equal(format(99.95,'%'),'100.0%');assert.throws(()=>format(Infinity,'%'));
});
test('caption ordering, exclusive ends and bounds',()=>{
 for(const captions of [[{start:0,end:901,text:'x'}],[{start:2,end:2,text:'x'}],[{start:0,end:30,text:'x'},{start:29,end:40,text:'y'}]]) assert.equal(schema.safeParse({...p,captions}).success,false);
 assert.match(srt(p),/00:00:10,000 --> 00:00:20,000/);
 assert.throws(()=>html(p,900,'')); assert.throws(()=>html(p,0.5,''));
 assert.ok(!html(p,300,'').includes('一、收入增长'));
});
test('HTML escaping and both SVG chart types',()=>{
 assert.ok(html({...p,title:'<script>'},0,'').includes('&lt;script&gt;'));
 assert.ok(html({...p,chart:'line'},0,'').includes('<polyline'));
});
