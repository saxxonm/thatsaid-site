(function(){
var d=document,h=d.documentElement,w=window;
var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;
var c=navigator.connection||{};var save=!!c.saveData;
var low=save||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||(navigator.deviceMemory&&navigator.deviceMemory<=2);
if(low)h.classList.add('lowpower');
var small=w.matchMedia('(max-width:600px)');
var stage=d.getElementById('stage');
if(location.hash==='#poster-sm'){stage.classList.add('stack');}
var io='IntersectionObserver' in w;

/* scroll reveals */
if(!reduce&&io){h.classList.add('rvon');var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('seen');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
d.querySelectorAll('.rv').forEach(function(el){ro.observe(el)});}

/* hero: inline loop (fallback) */
var items=[].slice.call(stage.querySelectorAll('[data-at]')),pop=stage.querySelector('.pop'),step=0,timer=null,running=false;
var T=[600,1200,1000,1000,1000,800,1200,1000,800,1000];/* ms before steps 1..10; then hold */
function set(n){step=n;items.forEach(function(el){el.classList.toggle('in',+el.dataset.at<=n)});for(var i=1;i<=9;i++)stage.classList.toggle('s'+i,n>=i);pop.classList.toggle('out',n>=5);}
function tick(){if(!running)return;if(step<9){set(step+1);timer=setTimeout(tick,T[step]||1000)}else{timer=setTimeout(function(){stage.classList.add('reset');set(0);setTimeout(function(){stage.classList.remove('reset');timer=setTimeout(tick,T[0])},500)},1800)}}
function start(){if(running)return;running=true;timer=setTimeout(tick,T[0])}
function stop(){running=false;clearTimeout(timer)}
var animOK=!reduce&&!low&&!small.matches&&location.hash.indexOf('poster')<0;
if(animOK){stage.classList.add('anim');set(0);
 if(io){new IntersectionObserver(function(es){es[0].isIntersecting?start():stop()},{threshold:.2}).observe(stage)}else start();
 d.addEventListener('visibilitychange',function(){d.hidden?stop():start()});}
/* else: static end state (all items visible by default) */

/* hero: rendered video slot (media/*.mp4|webm). Only when motion allowed and not Save-Data. */
var v=stage.querySelector('video');
if(v&&!reduce&&!save&&io&&location.hash.indexOf('poster')<0){
 var vo=new IntersectionObserver(function(es){var e=es[0];
  if(e.isIntersecting){if(!v.dataset.loaded){v.dataset.loaded=1;v.autoplay=true;v.preload='metadata';
    v.addEventListener('loadeddata',function(){stage.classList.add('vid');stop()},{once:true});
    v.addEventListener('error',function(){stage.classList.remove('vid')},true);v.load();}
   var p=v.play();if(p&&p.catch)p.catch(function(){});}
  else v.pause();},{rootMargin:'200px'});
 vo.observe(stage);}

/* terminal typing */
var term=d.getElementById('term');
if(term&&!reduce&&io){var ty=term.querySelector('.typed'),full=ty.dataset.text;term.classList.add('pending');ty.textContent='';
 var to=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;to.disconnect();term.classList.remove('pending');term.classList.add('typing');var i=0;
  (function t(){ty.textContent=full.slice(0,++i);if(i<full.length)setTimeout(t,28+Math.random()*30);else setTimeout(function(){term.classList.remove('typing')},450)})();},{threshold:.5});
 to.observe(term);}
})();
