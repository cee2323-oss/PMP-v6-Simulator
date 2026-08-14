(function(){
  let pendingFocus=null;
  let lastAnnouncedQuestion='';
  const main=document.getElementById('main');
  if(!main) return;

  function ensureStyle(){
    if(document.getElementById('pmp-a11y-style')) return;
    const style=document.createElement('style');
    style.id='pmp-a11y-style';
    style.textContent='.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}.question-region:focus-within{outline-offset:4px}';
    document.head.appendChild(style);
  }

  function ensureLiveRegion(){
    let live=document.getElementById('sr-question-announcer');
    if(!live){
      live=document.createElement('div');
      live.id='sr-question-announcer';
      live.className='sr-only';
      live.setAttribute('aria-live','polite');
      live.setAttribute('aria-atomic','true');
      document.body.appendChild(live);
    }
    return live;
  }

  function keyFromSortItem(item){
    const text=item?.querySelector('strong')?.textContent||'';
    return text.replace(/[^A-D]/gi,'').toUpperCase().slice(0,1);
  }

  function cleanText(text){
    return String(text||'').replace(/\s+/g,' ').trim();
  }

  function optionText(label,index){
    const text=cleanText(label?.textContent);
    return text || `Answer choice ${index+1}`;
  }

  function enhanceQuestionSemantics(){
    const question=main.querySelector('.question');
    if(!question) return;

    const qn=(main.querySelector('.muted')?.textContent||'').match(/Question\s+(\d+)\s+of/i)?.[1]||'current';
    const qid=`question-heading-${qn}`;
    question.id=qid;
    question.setAttribute('tabindex','-1');
    question.setAttribute('role','heading');
    question.setAttribute('aria-level','2');

    const card=question.closest('.card');
    if(card){
      card.classList.add('question-region');
      card.setAttribute('role','region');
      card.setAttribute('aria-labelledby',qid);
    }

    const answerStack=question.nextElementSibling;
    if(answerStack?.classList.contains('stack')){
      const optionLabels=[...answerStack.querySelectorAll('label.option')];
      const radios=answerStack.querySelectorAll('input[type="radio"]');
      const checks=answerStack.querySelectorAll('input[type="checkbox"]');
      if(radios.length){
        answerStack.setAttribute('role','radiogroup');
        answerStack.setAttribute('aria-labelledby',qid);
      }else if(checks.length){
        answerStack.setAttribute('role','group');
        answerStack.setAttribute('aria-labelledby',qid);
      }

      optionLabels.forEach((label,index)=>{
        const input=label.querySelector('input');
        const textNode=label.querySelector('span')||label;
        if(!input) return;
        const labelId=`answer-label-${qn}-${index+1}`;
        textNode.id=labelId;
        input.id=input.id||`answer-${qn}-${index+1}`;
        input.setAttribute('aria-labelledby',labelId);
        input.setAttribute('aria-label',optionText(label,index));
        label.setAttribute('for',input.id);
      });

      if(optionLabels.length){
        let summary=card?.querySelector('#sr-answer-summary');
        if(!summary&&card){
          summary=document.createElement('div');
          summary.id='sr-answer-summary';
          summary.className='sr-only';
          card.insertBefore(summary,answerStack);
        }
        if(summary){
          summary.textContent='Answer choices: '+optionLabels.map(optionText).join('. ')+'.';
          question.setAttribute('aria-describedby',summary.id);
        }
      }
    }

    const promptText=cleanText(question.textContent);
    if(promptText&&promptText!==lastAnnouncedQuestion){
      const labels=[...main.querySelectorAll('label.option')].map(optionText);
      const announcement=labels.length?`${promptText}. Answer choices: ${labels.join('. ')}.`:promptText;
      ensureLiveRegion().textContent=announcement;
      lastAnnouncedQuestion=promptText;
    }
  }

  function enhance(){
    ensureStyle();
    enhanceQuestionSemantics();

    const progress=main.querySelector('.progressbar');
    if(progress){
      const fill=progress.firstElementChild;
      const width=parseFloat(fill?.style?.width||'0')||0;
      progress.setAttribute('role','progressbar');
      progress.setAttribute('aria-label','Question progress');
      progress.setAttribute('aria-valuemin','0');
      progress.setAttribute('aria-valuemax','100');
      progress.setAttribute('aria-valuenow',String(Math.round(width)));
    }

    const timer=main.querySelector('#timer');
    if(timer){
      timer.setAttribute('role','timer');
      timer.setAttribute('aria-label','Time remaining');
    }

    main.querySelectorAll('.match-row').forEach((row,index)=>{
      const prompt=row.querySelector('div');
      const select=row.querySelector('select[data-match]');
      if(!prompt||!select) return;
      if(!prompt.id) prompt.id=`match-prompt-${index+1}`;
      select.setAttribute('aria-labelledby',prompt.id);
      select.setAttribute('aria-label',`Match response for ${cleanText(prompt.textContent)||`situation ${index+1}`}`);
    });

    main.querySelectorAll('.sort-list').forEach(list=>{
      list.setAttribute('role','list');
      const question=main.querySelector('.question');
      if(question?.id) list.setAttribute('aria-labelledby',question.id);
    });
    main.querySelectorAll('.sort-item').forEach((item,index)=>{
      item.setAttribute('role','listitem');
      const label=cleanText(item.querySelector('span:first-child')?.textContent)||`item ${index+1}`;
      const up=item.querySelector('[data-up]');
      const down=item.querySelector('[data-down]');
      if(up) up.setAttribute('aria-label',`Move ${label} up. Current position ${index+1}.`);
      if(down) down.setAttribute('aria-label',`Move ${label} down. Current position ${index+1}.`);
    });

    const answered=main.querySelectorAll('.navq');
    answered.forEach((b)=>b.removeAttribute('aria-current'));
    const questionText=main.querySelector('.muted')?.textContent||'';
    const match=questionText.match(/Question\s+(\d+)\s+of/i);
    if(match){
      const current=main.querySelector(`.navq[data-q="${Number(match[1])-1}"]`);
      if(current) current.setAttribute('aria-current','step');
    }
  }

  function restoreFocus(){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      enhance();
      if(!pendingFocus) return;
      let target=null;
      if(pendingFocus.kind==='question'){
        target=main.querySelector('.question');
      }else if(pendingFocus.kind==='answer'){
        target=main.querySelector(`[data-answer="${pendingFocus.key}"]`);
      }else if(pendingFocus.kind==='match'){
        target=main.querySelector(`[data-match="${pendingFocus.key}"]`);
      }else if(pendingFocus.kind==='order'){
        const item=[...main.querySelectorAll('.sort-item')].find(x=>keyFromSortItem(x)===pendingFocus.key);
        target=item?.querySelector(pendingFocus.direction==='up'?'[data-up]':'[data-down]')||item?.querySelector('button');
      }
      if(target&&typeof target.focus==='function') target.focus();
      pendingFocus=null;
    }));
  }

  document.addEventListener('click',event=>{
    const orderButton=event.target.closest?.('[data-up],[data-down]');
    if(orderButton){
      pendingFocus={kind:'order',key:keyFromSortItem(orderButton.closest('.sort-item')),direction:orderButton.hasAttribute('data-up')?'up':'down'};
      restoreFocus();
      return;
    }
    if(event.target.closest?.('#prev,#next,[data-q]')){
      pendingFocus={kind:'question'};
      restoreFocus();
    }
  });

  document.addEventListener('change',event=>{
    const target=event.target;
    if(target.matches?.('[data-answer]')){
      pendingFocus={kind:'answer',key:target.dataset.answer};
      restoreFocus();
    }else if(target.matches?.('[data-match]')){
      pendingFocus={kind:'match',key:target.dataset.match};
      restoreFocus();
    }
  });

  const observer=new MutationObserver(()=>enhance());
  observer.observe(main,{childList:true,subtree:true});
  enhance();
})();
