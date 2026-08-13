const assert=require('assert');const C=require('./core.js');
const base={Format:'single_response','Correct Key':'B'};assert.equal(C.score(base,'B'),true);assert.equal(C.score(base,'A'),false);
assert.equal(C.score({Format:'multiple_response','Correct Key':'A,C'},['C','A']),true);assert.equal(C.score({Format:'multiple_response','Correct Key':'A,C'},['A']),false);
assert.equal(C.score({Format:'ordering','Correct Key':'B,A,C,D'},['B','A','C','D']),true);
assert.equal(C.score({Format:'matching','Correct Key':'1-A;2-B;3-C;4-D'},{1:'A',2:'B',3:'C',4:'D'}),true);
const v=C.validateItems([{...{'Item ID':'X',Domain:'People',Approach:'Predictive',Format:'single_response','Stem / Prompt':'Q',A:'a',B:'b',C:'c',D:'d','Correct Key':'A'}}]);assert.equal(v.valid,true);
const dup=C.validateItems([{...v.items[0]},{...v.items[0]}]);assert(dup.errors.some(x=>x.includes('Duplicate Item ID')));
console.log('All core scoring/import tests passed');
