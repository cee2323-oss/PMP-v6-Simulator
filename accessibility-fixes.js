(function(){
  let pendingFocus=null;
  const main=document.getElementById('main');
  if(!main) return;

  function keyFromSortItem(item){
    const text=item?.querySelector('strong')?.textContent||'';
    return text.replace(/[^A-D]/gi,'').toUpperCase().slice(0,1);
  }

  function enhance(){
    const question=main.querySelector('.question');
    if(question){
      question.setAttribute('tabindex','-1');
      question.setAttribute('role','heading');
      question.setAttribute('aria-level','2');
    }

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
      if(!select.getAttribute('aria-label')){
        select.setAttribute('aria-label',`Match response for ${prompt.textContent.trim()||`situation ${index+1}`}`);
      }
    });

    main.querySelectorAll('.sort-item').forEach((item,index)=>{
      const label=item.querySelector('span:first-child')?.textContent?.trim()||`item ${index+1}`;
      const up=item.querySelector('[data-up]');
      const down=item.querySelector('[data-down]');
      if(up) up.setAttribute('aria-label',`Move ${label} up`);
      if(down) down.setAttribute('aria-label',`Move ${label} down`);
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
