/* thatsaid Agent Dictation flow loop. DRAFT. Self-contained: no page globals, no dependencies.
   Finds every [data-ad-flow] on the page. Motion only when allowed; otherwise the poster <picture> stays.
   Pauses offscreen (IntersectionObserver) and when the tab is hidden. 9.6 s loop.
   Review/QA hooks (optional): data-t="5700" renders one still frame; data-cut="mobile|desktop" forces a cut. */
(function(){
 'use strict';
 var T=9600,POSTER=5700;
 function cl(x){return x<0?0:x>1?1:x}
 function ease(x){x=cl(x);return 1-Math.pow(1-x,3)}
 function win(t,a,b,c,d){if(t<a||t>d)return 0;if(t<b)return ease((t-a)/(b-a));if(t<=c)return 1;return 1-ease((t-c)/(d-c))}
 function set(el,o,tf){el.style.opacity=o.toFixed(3);el.style.transform=tf||'';el.style.visibility=o<.002?'hidden':'visible'}
 function noise(t,i){return (Math.sin(t*.013+i*1.7)+Math.sin(t*.027+i*.6)+Math.sin(t*.0051+i*2.9))/3}
 function chordX(t){return t<4000}
 function init(root){
  if(root.__adf)return;root.__adf=1;
  var rm=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
  var still=root.hasAttribute('data-t');
  if(!still&&(rm.matches||!('IntersectionObserver' in window)||!window.requestAnimationFrame))return; /* poster stays */
  var scene=root.querySelector('.adf-scene'),doc=root.querySelector('[data-adf-doc]');
  [].forEach.call(root.querySelectorAll('[data-adf-clone]'),function(el){var c=doc.cloneNode(true);c.removeAttribute('data-adf-doc');el.appendChild(c)});
  var A={};[].forEach.call(root.querySelectorAll('[data-a]'),function(el){A[el.getAttribute('data-a')]=el});
  var bars=[].slice.call(A.icHold.querySelectorAll('.adf-b'));
  root.classList.add('adf-live');
  function mobile(){var c=root.getAttribute('data-cut');return c?c==='mobile':root.clientWidth<=600}
  function fit(){var w=root.clientWidth||1280;var m=mobile();root.__m=m;scene.style.transform=m?'scale('+(w/960)+') translate(-160px,-40px)':'scale('+(w/1280)+')'}
  fit();if(window.ResizeObserver)new ResizeObserver(fit).observe(root);else window.addEventListener('resize',fit);
  var last='';
  function render(t){
   /* key HUD: chord held, then Return in the review panel, then Return again in Grok Bot (it arrives prefilled) */
   var kv=Math.max(win(t,450,700,3300,3500),win(t,5750,5950,6500,6700),win(t,7050,7250,7900,8100));
   var m=root.__m;A.keys.style.left=(m?(chordX(t)?640:290):(t>7000?420:640))+'px';A.keys.style.top=(m?535:640)+'px';A.gb.style.top=m?'64px':'';A.gb.style.left=m?'636px':'';
   set(A.keys,kv,'translateX(-50%) translateY('+((1-kv)*16).toFixed(1)+'px)');
   var chord=t<4000;
   A.k1.style.display=A.k2.style.display=A.plus.style.display=chord?'':'none';A.kr.style.display=chord?'none':'';
   var hold=t>700&&t<3300;A.k1.classList.toggle('adf-on',hold);A.k2.classList.toggle('adf-on',hold);
   A.kr.classList.toggle('adf-on',(t>6000&&t<6250)||(t>7350&&t<7600));
   /* cursor chip: 'Agent…' while held, 'Transcribing…' after release */
   var cv=win(t,800,1000,3750,3950);set(A.chip,cv,'scale('+(.92+.08*cv).toFixed(3)+')');
   var tx=t>=3300;A.icHold.style.display=tx?'none':'';A.icTx.style.display=tx?'':'none';
   var lbl=tx?'Transcribing…':'Agent…';if(A.chipLbl.textContent!==lbl)A.chipLbl.textContent=lbl;
   for(var i=0;i<bars.length;i++){var lv=(t>900&&t<3300)?.3+.7*Math.abs(noise(t,i)):.55+.25*Math.sin(t*.004+i);bars[i].style.transform='scaleY('+Math.max(.25,Math.min(1,lv)).toFixed(3)+')'}
   set(A.cursor,t<4300||t>9300?1:Math.max(0,1-(t-4300)/200));
   /* review panel */
   var pin=t>=3800?ease((t-3800)/380):0,pout=t>6250?ease((t-6250)/260):0,pv=pin*(1-pout);
   set(A.panel,pv,'scale('+(1.15*(.96+.04*pin)*(1-.06*pout)).toFixed(4)+')');
   /* the edit: the transcript says '3'; it gets selected and typed over with 'three' */
   var w,sel=false;if(t<4650)w='3';else if(t<5000){w='3';sel=true}else{var n=Math.floor((t-5000)/70);w='three'.slice(0,Math.max(0,Math.min(5,n)))}
   if(w+sel!==last){A.t2.innerHTML=sel?'<span class="adf-sel">3</span>':w;last=w+sel}
   A.caret.style.opacity=(t>4650&&t<5000)?0:((Math.floor(t/530)%2)?.15:1);
   var pr=t>6000&&t<6250;A.send.style.transform=pr?'scale(.97)':'';A.send.style.filter=pr?'brightness(1.1)':'';
   /* Grok Bot: composer prefilled with the text and the screenshot path; Return sends */
   var gv=win(t,6250,6650,9050,9450);set(A.gb,gv,'translateX('+((1-gv)*40).toFixed(1)+'px)');
   var sent=t>7500,pf=t>6550&&!sent;
   A.cfill.style.display=pf?'':'none';A.cph.style.display=pf?'none':'';A.comp.classList.toggle('adf-filled',pf);
   var mv=sent?ease((t-7500)/380):0;set(A.msg,mv,'translateY('+((1-mv)*40).toFixed(1)+'px)');
   set(A.typing,t>8100?ease((t-8100)/250):0);
   [].forEach.call(A.typing.children,function(d,k){d.style.transform='translateY('+(Math.sin(t*.012-k*.9)*-2.5).toFixed(2)+'px)'});
  }
  if(still){render(+root.getAttribute('data-t')||POSTER);return}
  var t0=null,acc=0,raf=0,vis=false;
  function frame(now){raf=requestAnimationFrame(frame);if(t0===null)t0=now-acc;acc=(now-t0)%T;render(acc)}
  function play(){if(!raf&&vis&&!document.hidden){t0=null;raf=requestAnimationFrame(frame)}}
  function pause(){if(raf)cancelAnimationFrame(raf);raf=0}
  render(0);
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;vis?play():pause()},{threshold:.15}).observe(root);
  document.addEventListener('visibilitychange',function(){document.hidden?pause():play()});
  if(rm.addEventListener)rm.addEventListener('change',function(e){if(e.matches){pause();root.classList.remove('adf-live')}});
 }
 function boot(){[].forEach.call(document.querySelectorAll('[data-ad-flow]'),init)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
