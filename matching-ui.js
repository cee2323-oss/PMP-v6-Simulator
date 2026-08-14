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

  function makeRadioGroup(row,rowIndex,select,parsed,source){
    const group=document.createElement('fieldset');
    group.className='match-group';
    group.dataset.matchGroup=String(rowIndex+1);

    const legend=document.createElement('legend');
    legend.className='match-legend';
    legend.textContent=`${rowIndex+1}. ${source||'Situation text unavailable — item requires remediation.'}`;
    group.appendChild(legend);

    const choices=document.createElement('div');
    choices.className='match-choices';
    parsed.forEach((entry,index)=>{
      const value=entry.option.value;
      const label=document.createElement('label');
      label.className='match-choice';
      const radio=document.createElement('input');
      radio.type='radio';
      radio.name=`match-group-${rowIndex+1}`;
      radio.value=value;
      radio.checked=entry.option.selected;
      radio.disabled=select.disabled;
      radio.setAttribute('aria-label',`${value}. ${entry.right||entry.option.textContent.trim()}`);
      const text=document.createElement('span');
      text.innerHTML=`<strong>${value}.</strong> `;
      text.appendChild(document.createTextNode(entry.right||entry.option.textContent.trim()));
      label.appendChild(radio);
      label.appendChild(text);
      choices.appendChild(label);

      radio.addEventListener('change',()=>{
        if(!radio.checked) return;
        select.value=value;
        if(typeof select.onchange==='function') select.onchange();
        const status=group.querySelector('.match-status');
        if(status) status.textContent=`Selected ${value}. ${entry.right||entry.option.textContent.trim()} for situation ${rowIndex+1}.`;
      });
    });
    group.appendChild(choices);

    const status=document.createElement('div');
    status.className='sr-only match-status';
    status.setAttribute('aria-live','polite');
    status.setAttribute('aria-atomic','true');
    group.appendChild(status);
    return group;
  }

  function enhanceMatching(){
    document.querySelectorAll('.match-row').forEach((row,rowIndex)=>{
      const select=row.querySelector('select[data-match]');
      if(!select||select.dataset.enhanced==='true') return;
      const choices=[...select.options].filter(o=>o.value);
      if(!choices.length) return;
      const parsed=choices.map(o=>({option:o,...cleanPair(o.textContent)}));
      let source=parsed[rowIndex]?.left||'';
      if(!source && isDemoMatchingPrompt()) source=DEMO_FALLBACK[rowIndex]||'';

      const group=makeRadioGroup(row,rowIndex,select,parsed,source);
      row.classList.add('accessible-match-row');
      row.innerHTML='';
      row.appendChild(group);
      row.appendChild(select);

      select.hidden=true;
      select.tabIndex=-1;
      select.setAttribute('aria-hidden','true');
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
