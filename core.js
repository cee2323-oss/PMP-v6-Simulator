(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.PMPCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const FORMATS=['single_response','multiple_response','ordering','matching','calculation_interpretation','graphic_interpretation'];
  const REQUIRED=['Item ID','Domain','Approach','Format','Stem / Prompt','A','B','C','D','Correct Key'];
  function splitKey(v){return String(v||'').split(',').map(x=>x.trim()).filter(Boolean)}
  function normalizeMatchingKey(v){
    const raw=String(v||'').replace(/\s+/g,'').replace(/,/g,';');
    if(/^([ABCD];){3}[ABCD]$/.test(raw)) return raw.split(';').map((x,i)=>`${i+1}-${x}`).join(';');
    return raw;
  }
  function score(item,response){
    if(response==null) return false;
    const f=item.Format;
    const key=String(item['Correct Key']||'').trim();
    if(f==='single_response'||f==='calculation_interpretation'||f==='graphic_interpretation') return String(response).trim()===key;
    if(f==='multiple_response'){
      const a=new Set(Array.isArray(response)?response:splitKey(response)); const b=new Set(splitKey(key));
      return a.size===b.size&&[...a].every(x=>b.has(x));
    }
    if(f==='ordering'){
      const arr=Array.isArray(response)?response:String(response).split(',').map(x=>x.trim());
      return arr.join(',')===key.replace(/\s+/g,'');
    }
    if(f==='matching'){
      if(typeof response==='object'&&!Array.isArray(response)){
        const parts=Object.keys(response).sort((a,b)=>Number(a)-Number(b)).map(k=>`${k}-${response[k]}`);
        return normalizeMatchingKey(parts.join(';'))===normalizeMatchingKey(key);
      }
      return normalizeMatchingKey(response)===normalizeMatchingKey(key);
    }
    return false;
  }
  function normalizeItem(raw){
    const r={...raw};
    r['Source Format']=r['Source Format']||r.Format;
    if(r.Format==='case_single') r.Format='single_response';
    if(r.Format==='case_multiple') r.Format='multiple_response';
    if((r.Format==='graphic_interpretation'||r.Format==='calculation_interpretation')&&!r['Artifact Text Equivalent']) r['Artifact Text Equivalent']=r['Stem / Prompt']||'';
    return r;
  }
  function validateItems(input){
    const items=(Array.isArray(input)?input:(input&&Array.isArray(input.items)?input.items:[])).map(normalizeItem);
    const errors=[],warnings=[]; const ids=new Set();
    const counts={domain:{},approach:{},format:{}};
    for(let i=0;i<items.length;i++){
      const it=items[i]; const row=i+1;
      for(const k of REQUIRED){ if(String(it[k]??'').trim()==='') errors.push(`Row ${row}: missing ${k}`); }
      if(ids.has(it['Item ID'])) errors.push(`Duplicate Item ID: ${it['Item ID']}`); else ids.add(it['Item ID']);
      if(!FORMATS.includes(it.Format)) errors.push(`Row ${row}: invalid Format '${it.Format}'`);
      if((it.Format==='graphic_interpretation'||it.Format==='calculation_interpretation')&&!String(it['Artifact Text Equivalent']||'').trim()) warnings.push(`Row ${row}: artifact item lacks text equivalent`);
      const key=String(it['Correct Key']||'').trim();
      if(key&&!['ordering','matching','multiple_response'].includes(it.Format)&&!['A','B','C','D'].includes(key)) errors.push(`Row ${row}: invalid single key '${key}'`);
      if(it.Format==='matching'&&!/^1-[ABCD];2-[ABCD];3-[ABCD];4-[ABCD]$/.test(normalizeMatchingKey(key))) errors.push(`Row ${row}: invalid matching key '${key}'`);
      for(const d of [['domain',it.Domain],['approach',it.Approach],['format',it.Format]]) counts[d[0]][d[1]]=(counts[d[0]][d[1]]||0)+1;
    }
    return {items,errors,warnings,counts,valid:errors.length===0};
  }
  function parseCSV(text){
    const rows=[]; let row=[],cell='',q=false;
    for(let i=0;i<text.length;i++){
      const c=text[i],n=text[i+1];
      if(q&&c==='"'&&n==='"'){cell+='"';i++;continue}
      if(c==='"'){q=!q;continue}
      if(!q&&c===','){row.push(cell);cell='';continue}
      if(!q&&(c==='\n'||c==='\r')){if(c==='\r'&&n==='\n')i++;row.push(cell);cell='';if(row.some(x=>x!==''))rows.push(row);row=[];continue}
      cell+=c;
    }
    row.push(cell); if(row.some(x=>x!==''))rows.push(row);
    if(!rows.length)return[]; const headers=rows.shift().map(x=>x.trim());
    return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])));
  }
  return {FORMATS,score,normalizeItem,validateItems,parseCSV,normalizeMatchingKey};
});
