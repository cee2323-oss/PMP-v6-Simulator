(function(){
  function cleanPair(text){
    const raw=String(text||'').replace(/^[A-D]\.\s*/, '').trim();
    const pos=raw.indexOf('→');
    if(pos<0) return {left:'',right:raw};
    return {left:raw.slice(0,pos).trim().replace(/^\d+\.\s*/,''),right:raw.slice(pos+1).trim()};
  }
  function enhanceMatching(){
    document.querySelectorAll('.match-row').forEach((row,rowIndex)=>{
      const select=row.querySelector('select[data-match]');
      if(!select||select.dataset.enhanced==='true') return;
      const choices=[...select.options].filter(o=>o.value);
      if(!choices.length) return;
      const parsed=choices.map(o=>({option:o,...cleanPair(o.textContent)}));
      if(!parsed.some(x=>x.left)) return;
      const source=parsed[rowIndex]&&parsed[rowIndex].left;
      const label=row.querySelector('div');
      if(source&&label){
        label.innerHTML='';
        const strong=document.createElement('strong');
        strong.textContent=(rowIndex+1)+'. ';
        label.appendChild(strong);
        label.appendChild(document.createTextNode(source));
        select.setAttribute('aria-label','Match response for '+source);
      }
      parsed.forEach(x=>{ if(x.right) x.option.textContent=x.option.value+'. '+x.right; });
      select.dataset.enhanced='true';
    });
    document.querySelectorAll('.feedback p').forEach(p=>{
      if(!/^Correct key:/i.test(p.textContent||'')) return;
      const m=(p.textContent||'').match(/Correct key:\s*([A-D](?:\s*,\s*[A-D]){3})\s*$/i);
      if(m&&window.PMPCore&&window.PMPCore.normalizeMatchingKey){
        p.innerHTML='<strong>Correct key:</strong> '+window.PMPCore.normalizeMatchingKey(m[1].toUpperCase());
      }
    });
  }
  const observer=new MutationObserver(enhanceMatching);
  const main=document.getElementById('main');
  if(main) observer.observe(main,{childList:true,subtree:true});
  enhanceMatching();
})();
