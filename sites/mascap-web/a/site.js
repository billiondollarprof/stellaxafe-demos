
/* sites/mascap-web/a/site.js: the behaviour of the MASCAP concept website.
   Adapted from the Olympus concept site (Anthony's design), with Rhema's card stack.
   Never: send anything anywhere but WhatsApp, and only when the visitor presses Send. */
document.documentElement.classList.add('js');
const IMG='/i/',$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],RM=matchMedia('(prefers-reduced-motion:reduce)').matches,WA='2348133993514';
try{if(localStorage.getItem('mth')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}
const IC={cal:'<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',steth:'<path d="M6 3v6a6 6 0 0 0 12 0V3"/><path d="M12 15v2a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="14" r="2"/>',lab:'<path d="M9 3h6M10 3v6L4 20a1 1 0 0 0 1 1.5h14A1 1 0 0 0 20 20l-6-11V3"/><path d="M7 15h10"/>',pill:'<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-45 12 12.5)"/><path d="M9.5 10l5 5"/>',play:'<path fill="currentColor" stroke="none" d="M8 5v14l11-7z"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',glass:'<path d="M8 22h8M12 15v7M5 3h14l-7 12z"/><path d="M7.5 7h9"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',gym:'<path d="M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',ig:'<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01"/>',fb:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',wa:'<path fill="currentColor" stroke="none" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41Z"/>'};
$$('[data-i]').forEach(e=>e.outerHTML=`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[e.dataset.i]}</svg>`);
const ts=$('#ts'),toast=t=>{ts.textContent=t;ts.classList.add('on');setTimeout(()=>ts.classList.remove('on'),2800)};
$('#th').onclick=()=>{const r=document.documentElement,d=r.dataset.theme!=='dark';if(d)r.dataset.theme='dark';else delete r.dataset.theme;try{localStorage.setItem('mth',d?'dark':'light')}catch(e){}};
/* menu */
const mn=$('#mn'),mb=$('#mb'),sh=$('#sh'),op=v=>{if(v)mn.style.top=$('header').getBoundingClientRect().bottom+8+'px';mn.classList.toggle('open',v);sh.classList.toggle('on',v);mb.setAttribute('aria-expanded',v)};
mb.onclick=()=>op(!mn.classList.contains('open'));sh.onclick=()=>op(0);mn.onclick=e=>{if(e.target.closest('a'))op(0)};addEventListener('keydown',e=>e.key=='Escape'&&op(0));
/* hero slideshow: first image is in the HTML, the rest load after the page */
const hs=$('#hs'),sg=$('#sg'),pm=matchMedia('(orientation:portrait)').matches;let hi=0,ht,hims=[hs.firstElementChild];

addEventListener('load',()=>{const L=pm?['consult-p','lab-p','nurses-p','bp-p']:['consult','lab2','nurses','corridor'];
 L.forEach((k,i)=>{const m=new Image();m.src=IMG+k+'.webp';m.alt='';m.decoding='async';if(i%2==0)m.classList.add('zo');hs.append(m);hims.push(m)});
 hims.forEach(()=>sg.append(document.createElement('i')));shw(0)});
const shw=i=>{const p=hims[hi];if(p&&hi!=i){p.classList.remove('on');p.classList.add('out');setTimeout(()=>p.classList.remove('out'),1500)}const m=hims[i];m.classList.remove('out');void m.offsetWidth;m.classList.add('on');hi=i;[...sg.children].forEach((b,j)=>{b.classList.remove('on');void b.offsetWidth;if(j==i)b.classList.add('on')});clearTimeout(ht);if(!RM)ht=setTimeout(()=>shw((i+1)%hims.length),5200)};
/* marquees */
const mq=(id,items)=>{const d=document.createElement('div');for(let r=0;r<2;r++)items.forEach(t=>{const s=document.createElement('span');s.textContent=t;d.append(s);const p=document.createElement('i');p.textContent='✦';d.append(p)});$(id).append(d)};
mq('#m1',['Consultation','Laboratory','Pharmacy','Nursing care','Antenatal care','Children']);mq('#m2',['Ear, nose and throat','Check-ups','Vital signs','Front desk','Emergency','Family care']);
/* one scroll loop: progress bar, header, hero layers, parallax, marquee speed, scrub */
const pg=$('#pg'),hdr=$('header'),hin=$('#hin'),l1=$('#ly1'),l2=$('#ly2'),pxs=$$('.px'),mqa=()=>$$('.mq>div').flatMap(d=>d.getAnimations());
const stg=$('#visit'),lys=$$('#stage .ly'),scs=$$('#stage .sc'),tls=[...$('#tl').children],cn=$('#cn'),hint=$('#hint'),wl=$('#wl'),N=lys.length;
const sks=$$('.sk'),rgv=$('#rgv'),TOUCH=matchMedia('(hover:none)').matches;let ly=scrollY,boost=1,last=-1,rgA=0,rgT=0,rgIn=0,rgY=scrollY,lastY=-1,lastH=0,MQA=null;
function frame(){const y=scrollY,vh=innerHeight,moved=y!==lastY||vh!==lastH;lastY=y;lastH=vh;
 if(moved){const dh=document.documentElement.scrollHeight-vh;pg.style.transform=`scaleX(${dh>0?y/dh:0})`;hdr.classList.toggle('scd',y>10)}
 if(!RM&&!TOUCH&&moved){
  if(y<vh*1.2){hs.style.transform=`translate3d(0,${y*.35}px,0)`;l1.style.transform=`translate3d(0,${y*.2}px,0)`;l2.style.transform=`translate3d(0,${y*.1}px,0)`;hin.style.transform=`translate3d(0,${y*-.06}px,0)`;hin.style.opacity=Math.max(0,1-y/(vh*.8))}
  const pr=pxs.map(el=>el.getBoundingClientRect());pxs.forEach((el,i)=>{const r=pr[i];if(r.bottom<-100||r.top>vh+100)return;const cc=(r.top+r.height/2-vh/2)/vh;el.style.transform=`translate3d(0,${(-cc*100*(+el.dataset.s)).toFixed(1)}%,0)`});
 }
 if(!RM&&!TOUCH){MQA=MQA||$$('.mq>div').flatMap(d=>d.getAnimations());const tb=Math.min(1+Math.abs(y-ly)/12,5);boost+=(tb-boost)*.2;boost+=(1-boost)*.05;ly=y;if(Math.abs(boost-(MQA[0]&&MQA[0].playbackRate||1))>.02)MQA.forEach(a=>a.playbackRate=boost)}
 if(moved){
  const r=stg.getBoundingClientRect();
  const sr=sks.map(s=>s.getBoundingClientRect());
  if(r.top<vh&&r.bottom>0){const p=Math.min(1,Math.max(0,-r.top/(r.height-vh))),f=p*(N-1);let k=0,wy=-1;
   lys.forEach((im,i)=>{if(i){const t=Math.min(1,Math.max(0,(f-(i-1)-.2)/.6));im.style.clipPath=`inset(${(100-t*100).toFixed(2)}% 0 0 0)`;if(t>0&&t<1)wy=100-t*100;if(t>=.5)k=i;if(!RM)im.style.transform=`scale(${(1.12-.12*t).toFixed(3)})`}
    else if(!RM)im.style.transform=`scale(${(1+.06*Math.min(1,f)).toFixed(3)})`});
   wl.style.opacity=wy<0?0:1;if(wy>=0)wl.style.top=wy+'%';
   tls.forEach((d,i)=>d.firstChild.style.setProperty('--f',Math.min(1,Math.max(0,f-i+.5)).toFixed(3)));
   hint.classList.toggle('off',p>.9);
   if(k!==last){last=k;scs.forEach((s,i)=>s.classList.toggle('on',i===k));tls.forEach((d,i)=>d.classList.toggle('on',i===k));cn.classList.add('fl');cn.textContent='0'+(k+1);void cn.offsetWidth;cn.classList.remove('fl')}}
  /* stacked cards: the one underneath shrinks and darkens as the next covers it */
  sks.forEach((c,i)=>{const n=sr[i+1];if(!n)return;const a=sr[i];if(a.bottom<-50||a.top>vh)return;const q=Math.min(1,Math.max(0,1-(n.top-a.top)/a.height));c.style.transform=RM?'':`scale(${(1-q*.07).toFixed(4)})`;c.style.setProperty('--p',(q*.55).toFixed(3))});
 }
 /* ring: slow drift, drag and keys; on desktop it also turns with the scroll */
 if(rgIn){if(!RM){rgT+=.05;if(!TOUCH)rgT+=(y-rgY)*.12}rgY=y;const prev=rgA;rgA+=(rgT-rgA)*.08;if(Math.abs(rgA-prev)>.001){ring.style.transform=`translateZ(${-RR}px) rotateY(${-rgA}deg)`;
  rcs.forEach((c,i)=>{let d=((i*ST-rgA)%360+540)%360-180;c.style.setProperty('--dm',Math.min(.75,Math.abs(d)/150).toFixed(2))})}
  const fi=((Math.round(rgA/ST)%nR)+nR)%nR;if(fi!==rgF){rgF=fi;rgc.textContent=GR[fi][1]+' · '+GR[fi][2]}}else rgY=y;
 requestAnimationFrame(frame)}
requestAnimationFrame(frame);
/* departments: Rhema's card stack, cards fan from a point below, autoplay */
const LB={};
const D=[['consult','Consultation','Doctors who listen and explain.'],['triage','Nursing care','Vital signs and everyday care.'],['lab','Laboratory','Tests done in the same building.'],['pharmacy','Pharmacy','Your medicine before you leave.'],['reception','Front desk','A warm welcome and a quick card.'],['nurses','Antenatal care','Care for mothers, visit by visit.']],dk=$('#dk'),dts=$('#dt'),nC=D.length;
D.forEach(d=>{const c=document.createElement('article');c.className='fc';const m=new Image();m.src=IMG+d[0]+'-s.webp';m.alt=d[1];m.decoding='async';m.loading='lazy';c.append(m);c.insertAdjacentHTML('beforeend',`<i class="dm"></i><div class="fi"><h3>${d[1]}</h3><p>${d[2]}</p><a class="btn" href="#book" data-b="${d[1]}">Book</a></div>`);dk.append(c);dts.append(document.createElement('i'))});
const fcs=$$('.fc'),fdd=[...dts.children];let cur=0,ftm,fhov=0,finV=0,fsx=null,fmoved=0;
const flay=()=>{fcs.forEach((c,i)=>{let o=((i-cur)%nC+nC)%nC;if(o>nC/2)o-=nC;const ab=Math.abs(o),jump=c._o!==undefined&&Math.abs(o-c._o)>2.5;c._o=o;if(jump)c.style.transition='none';
 c.style.transform=`translate(-50%,-50%) rotate(${o*12}deg) scale(${1-Math.min(ab,2.5)*.06})`;c.style.zIndex=Math.round(100-ab*10);c.style.opacity=ab<=1?1:Math.max(0,1-(ab-1)*.95);c.style.setProperty('--dim',Math.min(ab,1)*.5);c.style.pointerEvents=ab>.5?'none':'auto';if(jump){void c.offsetWidth;c.style.transition=''}});fdd.forEach((x,i)=>x.classList.toggle('on',i==cur))};
const fplan=()=>{clearTimeout(ftm);if(!RM&&finV&&!fhov&&!document.hidden)ftm=setTimeout(()=>{cur=(cur+1)%nC;flay();fplan()},2600)},fgo=i=>{cur=(i+nC)%nC;flay();fplan()};
flay();new IntersectionObserver(e=>{finV=e[0].isIntersecting;fplan()},{threshold:.35}).observe($('#departments'));document.addEventListener('visibilitychange',fplan);
dk.addEventListener('pointerenter',e=>{if(e.pointerType=='mouse'){fhov=1;fplan()}});dk.addEventListener('pointerleave',()=>{fhov=0;fplan()});dk.addEventListener('pointerdown',e=>{fsx=e.clientX;fmoved=0});
dk.addEventListener('pointerup',e=>{if(fsx===null)return;const d=e.clientX-fsx;fsx=null;if(Math.abs(d)>40){fmoved=1;fgo(cur+(d<0?1:-1))}});
fcs.forEach((c,i)=>c.addEventListener('click',e=>{if(fmoved||e.target.closest('a'))return;if(i!==cur)fgo(i)}));fdd.forEach((d,i)=>d.onclick=()=>fgo(i));
/* ring gallery */
const GR=[['dr2','Amaka, 34','Antenatal care','"They called me by name every visit."','1:12'],['consult','Mr Okoro, 67','Blood pressure clinic','"The doctor took his time with me."','0:58'],['nurses','Nurse Joy','Nursing care','"We know our patients."','1:05'],['bp','Mama Efe','Check-up','"Clean, quick and kind."','0:47'],['dr3','Dr Tobi','Consultation','"Ask me anything."','1:20'],['reception','A family visit','Front desk','"In and out in good time."','0:52'],['lab','Blessing','Laboratory','"My results came the same day."','0:44'],['dr1','Emeka, 29','Ear, nose and throat','"Finally sorted my ear."','1:02'],['pharmacy','Grace','Pharmacy','"Everything I needed was there."','0:39'],['dr4','Ruth, 41','Follow up visit','"They remembered my history."','1:10']];
const FP={dr1:'center 15%',dr2:'center 15%',dr3:'center 15%',dr4:'center 15%',pharmacy:'40% center'};
const ring=$('#ring'),rgc=$('#rgc'),nR=GR.length,ST=360/nR;let RR=0,rgF=-1;
GR.forEach((g,i)=>{const c=document.createElement('figure');c.className='rc';c.style.margin=0;c.innerHTML=`<img src="${IMG}${g[0]}-s.webp" alt="" loading="lazy" decoding="async"${FP[g[0]]?` style="object-position:${FP[g[0]]}"`:''}><b class="dur">${g[4]}</b><button class="pl" type="button" aria-label="Play ${g[1]}'s story (sample)"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button><span>${g[1]}<small>${g[2]}</small><em class="qt">${g[3]}</em></span>`;ring.append(c)});
/* play: a sample story, so it says so instead of playing */
const dv=$('#dv'),dvOn=v=>{dv.classList.toggle('on',v);dv.setAttribute('aria-hidden',!v);if(v)dv.querySelector('[data-dx]').focus()};
ring.addEventListener('click',e=>{const b=e.target.closest('.pl');if(!b)return;e.stopPropagation();dvOn(1)});dv.addEventListener('click',e=>{if(e.target==dv||e.target.closest('[data-dx]'))dvOn(0)});addEventListener('keydown',e=>e.key=='Escape'&&dvOn(0));
const rcs=[...ring.children],rgSize=()=>{const w=rcs[0].offsetWidth;RR=Math.round(w/2/Math.tan(Math.PI/nR)*1.07);rcs.forEach((c,i)=>c.style.transform=`rotateY(${i*ST}deg) translateZ(${RR}px)`)};rgSize();let rgW=innerWidth;addEventListener('resize',()=>{if(innerWidth!==rgW){rgW=innerWidth;rgSize()}});
rgc.textContent=GR[0][1]+' · '+GR[0][2];rgF=0;ring.style.transform=`translateZ(${-RR}px)`;
new IntersectionObserver(e=>{rgIn=e[0].isIntersecting},{rootMargin:'100px'}).observe(rgv);
let rx=null;rgv.addEventListener('pointerdown',e=>{if(e.target.closest('.pl'))return;rx=e.clientX;if(e.pointerType=='mouse')rgv.setPointerCapture(e.pointerId)});rgv.addEventListener('pointermove',e=>{if(rx===null)return;rgT-=(e.clientX-rx)*.35;rx=e.clientX});rgv.addEventListener('pointerup',()=>{rx=null;rgT=Math.round(rgT/ST)*ST});rgv.addEventListener('pointercancel',()=>rx=null);
rgv.addEventListener('keydown',e=>{if(e.key=='ArrowLeft'){rgT=Math.round(rgT/ST)*ST-ST;e.preventDefault()}if(e.key=='ArrowRight'){rgT=Math.round(rgT/ST)*ST+ST;e.preventDefault()}});
/* reviews */
const RV=$$('.rcd'),rd=$('#rds');let ri=0;RV.forEach(()=>rd.append(document.createElement('i')));
const rs=i=>{RV.forEach((c,j)=>{c.classList.toggle('on',j==i);c.classList.toggle('past',j==(i+RV.length-1)%RV.length)});[...rd.children].forEach((d,j)=>{d.classList.toggle('on',j==i);d.onclick=()=>rs(j)});ri=i};rs(0);if(!RM)setInterval(()=>rs((ri+1)%RV.length),5200);
/* reveal, counters, tilt */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});$$('.rv').forEach(e=>io.observe(e));
const co=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting||RM)return;co.unobserve(e.target);const t=+e.target.dataset.c,s=performance.now();(function f(n){const p=Math.min((n-s)/1600,1);e.target.textContent=Math.round(t*(1-Math.pow(1-p,3))).toLocaleString();if(p<1)requestAnimationFrame(f)})(s)}),{threshold:.6});$$('[data-c]').forEach(e=>co.observe(e));
if(!RM&&matchMedia('(hover:hover)').matches)$$('.tl3').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.transform=`perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) translateY(-4px)`});el.addEventListener('pointerleave',()=>el.style.transform='')});
/* call sheet */
const cs=$('#cs'),sheet=v=>{cs.classList.toggle('on',v);cs.setAttribute('aria-hidden',!v)};
document.addEventListener('click',e=>{if(e.target.closest('[data-call]')){e.preventDefault();op(0);sheet(1)}if(e.target==cs||e.target.closest('[data-x]'))sheet(0)});
$('#cp').onclick=()=>{(navigator.clipboard?navigator.clipboard.writeText('08065911940'):Promise.reject()).then(()=>toast('Number copied'),()=>toast('Number: 0806 591 1940'))};addEventListener('keydown',e=>e.key=='Escape'&&sheet(0));
/* booking wizard */
const B={type:'Consultation',guests:'Head office'},BT=['Consultation','Antenatal care','Laboratory','Nursing care','Ear, nose and throat','Child check-up','Pharmacy','Front desk'],BG=['Head office','Branch office'];let st=0;
const glide=box=>{let s=box.querySelector('.dsl');if(!s){s=document.createElement('i');s.className='dsl';box.prepend(s);box.classList.add('sl')}const c=box.querySelector('[aria-pressed=true]');if(!c||!c.offsetWidth)return;s.style.width=c.offsetWidth+'px';s.style.height=c.offsetHeight+'px';s.style.transform=`translate(${c.offsetLeft}px,${c.offsetTop}px)`};
const chips=(id,arr,key)=>{const box=$(id);box.innerHTML=arr.map(v=>`<button type="button" class="ch" aria-pressed="${v==B[key]}">${v}</button>`).join('');box.onclick=e=>{const b=e.target.closest('.ch');if(!b)return;$$(id+' .ch').forEach(x=>x.setAttribute('aria-pressed',x==b));B[key]=b.textContent;glide(box)}};
chips('#bt',BT,'type');chips('#bg',BG,'guests');
const dd=$('#dd');dd.min=new Date().toISOString().slice(0,10);
const view=()=>{$$('.pn').forEach(p=>p.classList.toggle('on',p.dataset.s==st));$$('#sp i').forEach((b,i)=>b.classList.toggle('on',i<=st));$('#bkb').style.visibility=st?'visible':'hidden';$('#go').textContent=st==3?'Send on WhatsApp':'Continue';if(st==0)requestAnimationFrame(()=>{glide($('#bt'));glide($('#bg'))});
 if(st==3)$('#smr').innerHTML=[['For',B.type],['Branch',B.guests],['Date',dd.value],['Time',$('#tm').value],['Name',$('#nm').value],['Phone',$('#ph').value],['Notes',$('#nt').value||'None']].map(r=>`<div><span>${r[0]}</span><b>${r[1].replace(/</g,'&lt;')}</b></div>`).join('')};
$('#go').onclick=()=>{const er=$('#er');er.textContent='';
 if(st==1&&!dd.value)return er.textContent='Choose a date to continue.';
 if(st==2){if(!$('#nm').value.trim())return er.textContent='Enter your name to continue.';if($('#ph').value.replace(/\D/g,'').length<10)return er.textContent='Enter a phone number with at least 10 digits.'}
 if(st==3){const ref='MCP-'+Math.random().toString(36).slice(2,8).toUpperCase(),t=`Hello MASCAP Hospitals, I would like an appointment.\nFor: ${B.type}\nBranch: ${B.guests}\nDate: ${dd.value}\nTime: ${$('#tm').value}\nName: ${$('#nm').value}\nPhone: ${$('#ph').value}\nNotes: ${$('#nt').value||'None'}\nRef: ${ref}`;open('https://wa.me/'+WA+'?text='+encodeURIComponent(t),'_blank');$$('.pn,#sp,#nv').forEach(e=>e.style.display='none');$('#ok').hidden=false;$('#rf').textContent=ref;return}
 st++;view()};
$('#bkb').onclick=()=>{st--;$('#er').textContent='';view()};view();
document.addEventListener('click',e=>{const a=e.target.closest('[data-b]');if(a){btPick=1;B.type=a.dataset.b;$$('#bt .ch').forEach(x=>x.setAttribute('aria-pressed',x.textContent==B.type));setTimeout(()=>glide($('#bt')),600)}});
let gW=innerWidth;addEventListener('resize',()=>{if(innerWidth!==gW){gW=innerWidth;glide($('#bt'));glide($('#bg'))}});
/* service menu on the hero button */
const SV=[['Consultation','steth','See a doctor','Consultation'],['Antenatal care','cal','Antenatal visit','For mothers'],['Laboratory','lab','Laboratory test','Tests on site'],['Ear, nose and throat','steth','Ear, nose and throat','ENT clinic'],['Child check-up','cal','A child check-up','For your little ones'],['Pharmacy','pill','Pharmacy','Ask about a medicine']];
const sv=$('#sv'),svb=$('#svb');sv.insertAdjacentHTML('beforeend',SV.map((x,i)=>`<button type="button" role="menuitem" data-v="${i}"><span class="ic"></span><span><b>${x[2]}</b><br><small>${x[3]}</small></span></button>`).join(''));
const ICS={steth:IC.steth,cal:IC.cal,lab:IC.lab,pill:IC.pill};$$('#sv button').forEach((b,i)=>b.firstChild.innerHTML=`<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICS[SV[i][1]]}</svg>`);
let svY=0;
/* The tray opens on the side with more room and is never taller than that room, so it always fits the screen and scrolls inside itself (Anthony, 2026-11-28: "the tray disappears... it doesn't even allow you to scroll it"). */
const svOpen=v=>{if(v){const r=svb.parentElement.getBoundingClientRect(),below=innerHeight-r.bottom-16,above=r.top-16,down=below>=Math.min(above,380)||below>above,room=Math.max(160,down?below:above);sv.style.maxHeight=Math.min(room,520)+'px';sv.classList.toggle('up',!down);sv.style.left=Math.max(16,Math.min(r.left,innerWidth-sv.offsetWidth-16))+'px';sv.style.top=down?r.bottom+8+'px':'';sv.style.bottom=down?'':innerHeight-r.top+8+'px';svY=scrollY}sv.classList.toggle('on',v);svb.setAttribute('aria-expanded',v);if(v)setTimeout(()=>sv.querySelector('button').focus({preventScroll:true}),60)};
svb.onclick=e=>{e.stopPropagation();svOpen(!sv.classList.contains('on'))};
document.addEventListener('click',e=>{if(!e.target.closest('#sv'))svOpen(0)});addEventListener('keydown',e=>e.key=='Escape'&&svOpen(0));/* The page moving a little (a finger resting on the tray) keeps it open; the page really scrolling away closes it. */addEventListener('scroll',()=>sv.classList.contains('on')&&Math.abs(scrollY-svY)>160&&svOpen(0),{passive:true});
sv.onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=SV[b.dataset.v][0];btPick=1;svOpen(0);B.type=t;$$('#bt .ch').forEach(x=>x.setAttribute('aria-pressed',x.textContent==t));st=0;view();$('#book').scrollIntoView({behavior:RM?'auto':'smooth'})};
/* ask MASCAP: answers from this page only */
const TEL='0806 591 1940',FAQ=[['How do I book?',()=>'Use the four step form on this page. When you finish, WhatsApp opens with your request written out. You can also call '+TEL+'.'],['Where are you?',()=>'The head office is at 34 Adeola Road, Sapele. The branch is on Egbokodo Road. The contact section has a directions link.'],['Do you treat ear problems?',()=>'Yes, the hospital sees ear, nose and throat problems. Book a visit or call '+TEL+' to ask.'],['Is there a pharmacy?',()=>'Yes. You can collect your medicine before you leave.']];
const RU=[[/book|appoint|visit|see a doctor|consult/,FAQ[0][1]],[/where|address|locat|direction|find|road/,FAQ[1][1]],[/ear|nose|throat|ent\b/,FAQ[2][1]],[/pharm|drug|medic/,FAQ[3][1]],[/lab|test|result|blood/,()=>'The laboratory is in the same building as the doctor, so most tests are done the same day.'],[/pregnan|antenatal|baby|mother|matern/,()=>'Antenatal care is offered. Book an antenatal visit on this page and the nurses will plan your visits with you.'],[/open|hour|time|weekend|sunday|night/,()=>'Call '+TEL+' to confirm the opening hours.'],[/price|cost|how much|fee|card/,()=>'The front desk confirms prices. Call '+TEL+' or send a WhatsApp message.'],[/call|phone|number|contact|whatsapp/,()=>'Call the hospital on '+TEL+', or WhatsApp the manager on 0813 399 3514.'],[/^(hi|hello|hey|good)/,()=>'Hello, welcome to MASCAP Hospitals. What would you like to know?'],[/thank/,()=>'You are welcome. We hope to see you soon.']];
const log=$('#log'),add=(t,c)=>{const d=document.createElement('div');d.className='msg '+c;d.textContent=t;log.append(d);log.scrollTop=log.scrollHeight;return d};
const ask=async(q,f)=>{add(q,'me');const ty=add('','bot');ty.innerHTML='<span class="ty"><i></i><i></i><i></i></span>';await new Promise(r=>setTimeout(r,650));ty.remove();const l=q.toLowerCase(),r=f||((RU.find(x=>x[0].test(l))||[0,()=>'I do not have that yet. Call '+TEL+' and the front desk will help.'])[1]);add(r(),'bot')};
$('#cps').innerHTML=FAQ.map((f,i)=>`<button type="button" data-q="${i}">${f[0]}</button>`).join('');$('#cps').onclick=e=>{const b=e.target.closest('button');if(b)ask(FAQ[b.dataset.q][0],FAQ[b.dataset.q][1])};
$('#cfm').onsubmit=e=>{e.preventDefault();const v=$('#ci').value.trim();if(v){$('#ci').value='';ask(v)}};
/* entrances: run once per element, then hand the element back to its normal styles */
if(!RM){const W=new Map(),fire=t=>{t.classList.add('in');setTimeout(()=>t.classList.remove('deal','uv','pop','in'),+t.dataset.hold||1800)};
 const ent=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;ent.unobserve(e.target);(W.get(e.target)||[]).forEach(fire)}),{rootMargin:'0px 0px -6% 0px'});
 const tag=(el,c,k,hold,watch)=>{if(!el)return;el.classList.remove('rv');el.classList.add(c);if(k!=null)el.style.setProperty('--k',k);if(hold)el.dataset.hold=hold;const w=watch||el;if(!W.has(w)){W.set(w,[]);ent.observe(w)}W.get(w).push(el)};
 ['.qa'].forEach(s=>{const g=$(s);if(!g)return;[...g.children].forEach((c,i)=>{c.classList.remove('rv');c.style.setProperty('--k',i)});tag(g,'deal',null,1200+g.children.length*80)});
 [['.ct .im',0]].forEach(([s,k])=>{const el=$(s);if(el)tag(el,'uv',k,1800,el.parentElement)});
 $$('.igg a').forEach((a,i)=>tag(a,'uv',i,2000,a.parentElement));
 tag($('.bk'),'pop',null,1200);
}
/* the coverflow keeps its own motion: no entrance on it */

/* booking chips: until the guest touches the form, the gold highlight moves from one option to the next */
let btPick=0,btI=0,btT=null,btIn=0;const btBox=$('#bt');
['pointerdown','keydown','focusin'].forEach(ev=>$('.bk').addEventListener(ev,()=>{btPick=1},{passive:true}));
const btStep=()=>{clearTimeout(btT);if(btPick||!btIn||RM||document.hidden||st!==0)return;const cs=[...btBox.querySelectorAll('.ch')];btI=(btI+1)%cs.length;cs.forEach((x,i)=>x.setAttribute('aria-pressed',i===btI));B.type=cs[btI].textContent;glide(btBox);btT=setTimeout(btStep,btI===0?2600:1500)};
new IntersectionObserver(e=>{btIn=e[0].isIntersecting;clearTimeout(btT);if(btIn&&!btPick){btI=[...btBox.querySelectorAll('.ch')].findIndex(x=>x.getAttribute('aria-pressed')==='true');btT=setTimeout(btStep,1400)}},{threshold:.5}).observe(btBox);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&btIn&&!btPick)btT=setTimeout(btStep,1200)});
