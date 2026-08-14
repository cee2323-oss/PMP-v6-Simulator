(function(){
  const DEMO_FALLBACK=[
    'Two team members are stuck in a disagreement that is disrupting delivery.',
    'A capable team member needs guidance to improve a skill without taking over the work.',
    'Two roles disagree about who has authority to approve a technical decision.',
    'A stakeholder who was previously supportive is now disengaged after a change in priorities.'
  ];

  function cleanPair(text){
    const raw=String(text||'').replace(/^[A-D]\.\s*/, '').trim();
    const pos=raw.indexOf('→');
    if(pos<0) return {left:'',right:raw};
    return {left:raw.slice(0,pos).trim().replace(/^\d+\.\s*/,''),right:raw.slice(pos+1).trim()};
  }

  function isDemoMatchingPrompt(){
    const q=(document.querySelector('.question')?.textContent||'').trim();
    return q==='Match each situation to the most appropriate response.' || q==='Match each situation to the response letter.';
  }

  function enhanceMatching(){
    document.querySelectorAll('.match-row').forEach((row,rowIndex)=>{
      const select=row.querySelector('select[data-match]');
      if(!select||select.dataset.enhanced==='true') return;
      const choices=[...select.options].filter(o=>o.value);
      if(!choices.length) return;
      const parsed=choices.map(o=>({option:o,...cleanPair(o.textContent)}));
      const label=row.querySelector('div');
      let source=parsed[rowIndex]?.left||'';

      if(!source && isDemoMatchingPrompt()) source=DEMO_FALLBACK[rowIndex]||'';

      if(label){
        label.innerHTML='';
        const strong=document.createElement('strong');
        strong.textContent=(rowIndex+1)+'. ';
        label.appendChild(strong);
        label.appendChild(document.createTextNode(source||'Situation text unavailable — item requires remediation.'));
      }

      if(source){
        select.setAttribute('aria-label','Match response for '+source);
      }else{
        select.setAttribute('aria-label','Matching response. Situation text unavailable; item requires remediation.');
      }

      if(parsed.some(x=>x.left)){
        parsed.forEach(x=>{ if(x.right) x.option.textContent=x.option.value+'. '+x.right; });
      }
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
