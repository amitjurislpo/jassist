(function(){
const $=(s,c=document)=>c.querySelector(s),$$=(s,c=document)=>[...c.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const cross='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/* ---- Intro ---- */
$$('.h1').forEach(h=>$$('.wd',h).forEach((w,i)=>w.style.transitionDelay=(.12+i*.1)+'s'));
requestAnimationFrame(()=>setTimeout(()=>document.body.classList.add('ready'),80));

/* ---- Mobile menu ---- */
const burgers=$$('.burger');
function toggleMenu(o){document.body.classList.toggle('menu-open',o);burgers.forEach(b=>{b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Close menu':'Open menu');});}
burgers.forEach(b=>b.addEventListener('click',()=>toggleMenu(!document.body.classList.contains('menu-open'))));
$$('.mnav a').forEach(a=>a.addEventListener('click',()=>toggleMenu(false)));

/* ---- Logos ---- */
$('#lgTrack').innerHTML=Array(16).fill('<div class="lg">Client logo</div>').join('');

/* ---- Services bento ---- */
const IC={
 cal:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
 chat:'<svg viewBox="0 0 24 24"><path d="M20 12.5a7.5 7.5 0 01-11 6.6L4 20l1-4.3A7.5 7.5 0 1120 12.5z"/></svg>',
 web:'<svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18M9 13.5l-2 1.75L9 17M15 13.5l2 1.75-2 1.75"/></svg>',
 home:'<svg viewBox="0 0 24 24"><path d="M4 11l8-6.5 8 6.5V20H4z"/><path d="M10 20v-5h4v5"/></svg>',
 trend:'<svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
 pen:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
 search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>',
 shape:'<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="4.5"/><rect x="11" y="11" width="9.5" height="9.5" rx="2"/></svg>',
 ledger:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h4"/></svg>'
};
const vizCal=()=>{const days=['Mon','Tue','Wed','Thu','Fri'];const pat=[['k','','t g'],['','g',''],['t k','',''],['','k','g'],['g','t','']];
  return `<div class="viz"><h6>This week <em>Managed by your EA</em></h6><div class="cal">${days.map((d,i)=>`<div class="d"><b>${d}</b>${pat[i].map((c,j)=>`<span class="ev ${c}" style="animation-delay:${(i*.25+j*.4).toFixed(2)}s"></span>`).join('')}</div>`).join('')}</div></div>`;};
const vizFn=()=>`<div class="viz"><h6>Pipeline <em>Illustrative</em></h6><div class="fn"><div><span>Leads</span><i style="--w:100%"></i></div><div><span>Contacted</span><i style="--w:76%;transition-delay:.15s"></i></div><div><span>Meetings</span><i style="--w:50%;transition-delay:.3s"></i></div><div><span>Opportunities</span><i style="--w:30%;transition-delay:.45s"></i></div></div></div>`;
const vizSeo=()=>`<div class="viz"><h6>Organic visibility <em>Illustrative</em></h6><div class="seo"><svg viewBox="0 0 300 150" preserveAspectRatio="none"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8C08A" stop-opacity=".45"/><stop offset="1" stop-color="#D8C08A" stop-opacity="0"/></linearGradient></defs><g class="grid"><line x1="0" y1="37" x2="300" y2="37"/><line x1="0" y1="75" x2="300" y2="75"/><line x1="0" y1="112" x2="300" y2="112"/></g><path class="ar" d="M0 130 C40 125 60 118 90 110 S150 95 180 70 S240 45 300 20 V150 H0Z"/><path class="ln" d="M0 130 C40 125 60 118 90 110 S150 95 180 70 S240 45 300 20"/><circle class="pt" cx="300" cy="20" r="5"/></svg></div><div class="kw"><span>local SEO</span><span>on-page</span><span>keywords</span><span>reporting</span></div></div>`;
const vizLdg=()=>`<div class="viz"><h6>Ledger <em>Sample</em></h6><div class="ldg">${[['Invoice #1042','AR'],['Vendor payment','AP'],['Office supplies','Expense'],['Bank feed','Reconcile']].map((r,i)=>`<div>${r[0]}<span>${r[1]}</span><span class="ok" style="transition-delay:${.3+i*.25}s"><svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="3.5" stroke-linecap="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>`).join('')}</div></div>`;
const S=[
 ['Virtual Executive Assistant','Calendar management, email management, scheduling, research, travel coordination, reporting and administrative support.','cal',vizCal],
 ['Social Media Management','Content planning, scheduling, publishing, community management, analytics and social media support.','chat'],
 ['Website Development','Business websites, landing pages, WordPress development, maintenance, updates and technical support.','web'],
 ['Real Estate Support','Property research, lead management, CRM updates, listing support, appointment scheduling and administrative assistance.','home'],
 ['Sales & Lead Generation','Lead research, prospecting, cold calling, email outreach, appointment setting, CRM management and follow-ups.','trend',vizFn],
 ['Content Creation','Blogs, website content, social media content, email content, marketing copy and business communications.','pen'],
 ['SEO Management','Keyword research, on-page SEO, local SEO, content optimization, competitor research and reporting.','search'],
 ['Graphic Design','Social media creatives, presentations, advertisements, brochures, marketing materials and business graphics.','shape'],
 ['Bookkeeping & Accounting Support','Bookkeeping, accounts payable, accounts receivable, invoice management, expense tracking, accounting data entry and QuickBooks support.','ledger',vizLdg]
];
$('#bento').innerHTML=S.map((s,i)=>{
  const t=`<div class="txt"><span class="ico">${IC[s[2]]}</span><h3>${s[0].replace('&','&amp;')}</h3><p>${s[1]}</p><span class="more">Learn More ${arrow}</span></div>`;
  return s[3]?`<a href="#contact" class="svc w2 rv">${t}${s[3]()}</a>`:`<a href="#contact" class="svc rv ${i%2?'d1':''}">${t}</a>`;
}).join('');
$$('.svc').forEach(c=>c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');}));

/* ---- Why tabs ---- */
const W=[['Dedicated Professionals','Get professionals assigned to your business based on your requirements.'],['Managed Support','J Assist handles coordination, performance monitoring and operational support.'],['Built Around Your Business','Your support team is structured around your actual workflow and requirements.'],['Flexible Scaling','Start with one professional and expand into a complete remote support team.'],['Cost-Efficient','Access skilled professionals without the overhead of traditional full-time hiring.']];
const tabs=$('#tabs');
tabs.innerHTML=W.map((w,i)=>`<button class="tab" role="tab" aria-selected="false" data-i="${i}"><h3><span class="no">0${i+1}</span>${w[0]}</h3><p>${w[1]}</p><span class="prog"><i></i></span></button>`).join('');
const scenes=$$('.scene'),tbs=$$('.tab');let cur=-1;
const roles=[['EA','g'],['SS',''],['BK','s'],['MK',''],['RE','s'],['TE','']];
function scaleAnim(){const box=$('#scaleAv');box.innerHTML=roles.map(r=>`<span class="av ${r[1]}">${r[0]}</span>`).join('');const avs=$$('.av',box);avs.forEach(a=>a.style.transform='scale(0)');
  avs.forEach((a,i)=>setTimeout(()=>{if(cur!==3)return;a.style.transform='scale(1)';$('#scaleN').textContent=(i+1)+(i?' professionals':' professional');},300+i*650));}
function show(i){
  if(i===cur)return;cur=i;
  tbs.forEach((t,j)=>{t.classList.toggle('on',j===i);t.setAttribute('aria-selected',j===i);const p=$('.prog i',t);p.style.animation='none';p.offsetWidth;p.style.animation='';});
  scenes.forEach((s,j)=>s.classList.toggle('on',j===i));
  if(i===3) scaleAnim();
}
tbs.forEach(t=>t.addEventListener('click',()=>{show(+t.dataset.i);}));
tabs.addEventListener('animationend',e=>{if(e.target.closest('.tab.on'))show((cur+1)%W.length);});
const whyEl=$('#why');
whyEl.addEventListener('pointerenter',()=>whyEl.classList.add('paused'));
whyEl.addEventListener('pointerleave',()=>whyEl.classList.remove('paused'));
show(0);

/* ---- Industries ---- */
const ICI={
 law:'<svg viewBox="0 0 24 24"><path d="M12 3v18M5 7h14M7 7l-3 7a3 3 0 006 0zM17 7l-3 7a3 3 0 006 0zM8 21h8"/></svg>',
 re:IC.home,
 cpa:'<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M16 11v4"/></svg>',
 ec:'<svg viewBox="0 0 24 24"><path d="M4 5h2l2 11h11l2-8H7"/><circle cx="9.5" cy="19.5" r="1.3"/><circle cx="17.5" cy="19.5" r="1.3"/></svg>',
 ps:'<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2M3 12h18"/></svg>',
 st:'<svg viewBox="0 0 24 24"><path d="M12 3c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="10" r="1.8"/><path d="M9 16l-2 4M15 16l2 4"/></svg>'
};
const IND=[
 ['Law Firms','law','Legal assistants for intake, scheduling, document formatting, billing support and client follow-ups, so attorneys stay on billable work.',['Intake','Billing','Scheduling']],
 ['Real Estate','re','Listing coordination, CRM updates, lead follow-up, showing schedules and transaction paperwork for agents and brokerages.',['Listings','CRM','Showings']],
 ['Accounting & CPA Firms','cpa','Bookkeeping, AP/AR, reconciliations and data entry support that scales with tax season and steadies the rest of the year.',['AP / AR','QuickBooks','Data entry']],
 ['E-commerce','ec','Store operations, product listings, customer email, social content and order support to keep your storefront moving.',['Listings','Support','Social']],
 ['Professional Services','ps','Executive assistance, proposal support, reporting and client communication for consultancies and agencies.',['Proposals','Reporting','Admin']],
 ['Startups & Small Businesses','st','A flexible bench of specialists, from your first assistant to a full support team, without building HR from scratch.',['Flexible','Multi-role','Scalable']]
];
const car=$('#car');
car.innerHTML=IND.map((d,i)=>`<article class="ic-card"><div class="top"><span class="ico">${ICI[d[1]]}</span><span class="n">0${i+1} / 06</span></div><h3>${d[0].replace('&','&amp;')}</h3><p>${d[2]}</p><div class="tg">${d[3].map(t=>`<span>${t}</span>`).join('')}</div></article>`).join('');
const cardW=()=>$('.ic-card').offsetWidth+18;
$('#next').onclick=()=>car.scrollBy({left:cardW()});
$('#prev').onclick=()=>car.scrollBy({left:-cardW()});
let down=false,sx=0,sl=0,moved=0;
car.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')return;down=true;moved=0;sx=e.clientX;sl=car.scrollLeft;});
addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-sx;moved=Math.abs(dx);if(moved>4)car.classList.add('drag');car.scrollLeft=sl-dx;});
addEventListener('pointerup',()=>{if(!down)return;down=false;car.classList.remove('drag');const w=cardW();car.scrollTo({left:Math.round(car.scrollLeft/w)*w});});
const cp=$('#carProg');
function carP(){const max=car.scrollWidth-car.clientWidth;const vis=car.clientWidth/car.scrollWidth;cp.style.width=(vis*100)+'%';cp.style.transform=`translateX(${max?car.scrollLeft/max*(1/vis-1)*100:0}%)`;}
car.addEventListener('scroll',carP,{passive:true});

/* ---- Compare ---- */
const CMP={t:['Recruitment','Interviews','Training','Administrative overhead','Replacement challenges','Higher operating costs'],j:['Professional matching','Dedicated support','Flexible staffing','Managed operations','Scalable teams','Business-focused support']};
const NOTE={t:'<span>The traditional route: <b>time, cost and risk</b> stay with you.</span><span>Switch to compare →</span>',j:'<span>With J Assist: <b>we handle the work behind the hire.</b></span><a href="#contact" class="btn btn-gold">Build My Team '+arrow+'</a>'};
const box=$('#cmpBox'),grid=$('#cmpGrid'),knob=$('#knob'),sbtn=$$('#switch button');
function placeKnob(){const on=$('#switch button.on');if(on){knob.style.width=on.offsetWidth+'px';knob.style.transform=`translateX(${on.offsetLeft-6}px)`;}}
function setMode(m,anim){
  box.classList.toggle('j',m==='j');
  grid.innerHTML=CMP[m].map((t,i)=>`<div class="ci${anim?' flip':''}" style="animation-delay:${i*.06}s"><span class="mk">${m==='j'?check:cross}</span>${t}</div>`).join('');
  $('#cmpNote').innerHTML=NOTE[m];
  sbtn.forEach(b=>{const on=b.dataset.m===m;b.classList.toggle('on',on);b.setAttribute('aria-selected',on);});
  placeKnob();
}
sbtn.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.m,true)));
setMode('j',false);

/* ---- Contact multi-step ---- */
const chipSets={indChips:['Law Firm','Real Estate','Accounting & CPA','E-commerce','Professional Services','Startup / Small Business','Other'],svcChips:S.map(s=>s[0]),numChips:['1','2–3','4–10','10+','Not sure yet']};
Object.entries(chipSets).forEach(([id,arr])=>{const el=$('#'+id);el.innerHTML=arr.map(t=>`<button type="button" class="chip" aria-pressed="false">${t.replace('&','&amp;')}</button>`).join('');
  el.addEventListener('click',e=>{const c=e.target.closest('.chip');if(!c)return;if(el.hasAttribute('data-single'))$$('.chip',el).forEach(x=>x!==c&&x.setAttribute('aria-pressed','false'));c.setAttribute('aria-pressed',c.getAttribute('aria-pressed')!=='true');el.closest('.f').classList.remove('bad');});});
let step=0;const panes=$$('.pane'),stepEls=$$('#steps>div'),nextB=$('#nextBtn'),backB=$('#back');
function valid(p){
  let ok=true,first=null;
  if(p===0){$$('[required]',panes[0]).forEach(f=>{const bad=!f.value.trim()||(f.type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));f.closest('.f').classList.toggle('bad',bad);if(bad){ok=false;first=first||f;}});}
  if(p===1){[['#indChips','#indF'],['#svcChips','#svcF']].forEach(([c,f])=>{const bad=!$$('.chip[aria-pressed="true"]',$(c)).length;$(f).classList.toggle('bad',bad);if(bad){ok=false;first=first||$('.chip',$(c));}});}
  if(first)first.focus();return ok;
}
function go(n){step=n;panes.forEach((p,i)=>p.classList.toggle('on',i===n));stepEls.forEach((s,i)=>s.classList.toggle('on',i<=n));backB.style.visibility=n?'visible':'hidden';
  nextB.innerHTML=n===2?'Request a Consultation '+arrow:'Continue '+arrow;$('#stepNote').textContent=`Step ${n+1} of 3`;}
nextB.addEventListener('click',()=>{if(!valid(step))return;if(step<2)go(step+1);else $('#lead').classList.add('sent');});
backB.addEventListener('click',()=>go(step-1));
$('#lead').addEventListener('submit',e=>{e.preventDefault();nextB.click();});
$$('#lead input').forEach(f=>f.addEventListener('input',()=>f.closest('.f').classList.remove('bad')));

/* ---- Reveal & counters ---- */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  if(e.target.id==='stats')$$('.count').forEach(el=>{const to=+el.dataset.to,t0=performance.now();const tk=t=>{const p=Math.min(1,(t-t0)/1500);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tk);};requestAnimationFrame(tk);});
}),{threshold:.15,rootMargin:'0px 0px -5% 0px'});
$$('.rv,#stats').forEach(el=>io.observe(el));

/* ---- Scroll: timeline ---- */
const rail=$('#rail'),tl=$('#tl'),sts=$$('.st');
function onScroll(){
  const r=tl.getBoundingClientRect(),mid=innerHeight*.55;
  rail.style.transform=`scaleY(${Math.min(1,Math.max(0,(mid-r.top)/r.height))})`;
  sts.forEach(s=>s.classList.toggle('on',s.getBoundingClientRect().top<mid));
}
addEventListener('scroll',onScroll,{passive:true});
addEventListener('resize',()=>{onScroll();carP();placeKnob();});
onScroll();carP();
document.fonts&&document.fonts.ready.then(()=>{placeKnob();carP();});

/* ---- Hero: role chips, checklist, time zones ---- */
const CH=[['cal','Executive Assistant'],['chat','Social Media'],['web','Website Development'],['home','Real Estate Support'],['trend','Sales & Lead Gen'],['search','SEO'],['pen','Content Creation'],['shape','Graphic Design'],['ledger','Bookkeeping']];
const chips=CH.map(c=>`<span class="rchip"><span class="ic">${IC[c[0]]}</span>${c[1].replace('&','&amp;')}</span>`).join('');
$('#hcTrack').innerHTML=chips+chips;
const hcRows=$$('#hcChecks .ck-row');let hci=0;
function hcTick(){if(hci<hcRows.length){hcRows[hci].classList.add('done');hci++;}else{hcRows.forEach(r=>r.classList.remove('done'));hci=0;}$('#hcPg').style.width=(hci/hcRows.length*100)+'%';$('#hcCount').textContent=hci+' / '+hcRows.length;}
if(!reduce)setInterval(hcTick,1500);else{hcRows.forEach(r=>r.classList.add('done'));}
function tzs(){$$('#hcTz .tzr').forEach(r=>{const o={};new Intl.DateTimeFormat('en-US',{timeZone:r.dataset.tz,hour:'numeric',minute:'2-digit',weekday:'short',hour12:true}).formatToParts(new Date()).forEach(x=>o[x.type]=x.value);
  const h24=+new Intl.DateTimeFormat('en-US',{timeZone:r.dataset.tz,hour:'numeric',hourCycle:'h23'}).format(new Date());
  const open=!['Sat','Sun'].includes(o.weekday)&&h24>=9&&h24<17;
  $('.t',r).textContent=`${o.hour}:${o.minute} ${o.dayPeriod}`;const s=$('.s',r);s.textContent=open?'Business hours':'After hours';s.classList.toggle('open',open);});}
tzs();setInterval(tzs,30000);
})();
