/* Speech Spine editor: renders one speech plan and reports every change through opts.onChange(state). */
window.SpeechEditor=(function(){
"use strict";
const ACTC=["a1","a2","a3","a4"];
const PURPOSES=[
  {k:"inform",label:"To inform",ph:"To inform my audience about…"},
  {k:"persuade",label:"To persuade",ph:"To persuade my audience that…"},
  {k:"entertain",label:"To entertain",ph:"To entertain my audience with…"},
  {k:"inspire",label:"To inspire",ph:"To inspire my audience to…"}];
const PH_NONE="Choose a general purpose above, then finish the sentence: what should the audience know, believe or do?";
const ST=["Image","Big phrase","Chart / data","Quote","Diagram","Video","Blank / black"];
const PT=["Prop","Video clip","Audio clip","Handout","Demo","Other"];
const WPM=130;

let S=null,root=null,opts={},openId=null,dragId=null,ro=null,query="";
const q=s=>root.querySelector(s);

function clone(o){return JSON.parse(JSON.stringify(o))}
function uid(){return "x"+Math.random().toString(36).slice(2,9)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fmtDur(sec){sec=Math.max(0,Math.round(sec||0));return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0")}
function fmtTC(sec){sec=Math.max(0,Math.round(sec||0));return [Math.floor(sec/3600),Math.floor(sec%3600/60),sec%60].map(n=>String(n).padStart(2,"0")).join(":")}
function parseDur(t){const p=String(t).trim().split(":");if(!p.every(x=>/^\d+$/.test(x))||p.length>3)return null;return p.reduce((a,x)=>a*60+(+x),0)}
function words(t){return (String(t||"").trim().match(/\S+/g)||[]).length}
function purposeLabel(k){const p=PURPOSES.find(x=>x.k===k);return p?p.label:""}
function specificPlaceholder(k){const p=PURPOSES.find(x=>x.k===k);return p?p.ph:PH_NONE}

/* ---------- model ---------- */
function newBeat(extra){return Object.assign({id:uid(),title:"",say:"",dur:60,energy:5,beat:"",notes:"",slides:[],props:[],script:"",stage:""},extra||{})}
function newCol(cards){return {id:uid(),title:"",summary:"",cards:cards||[newBeat()]}}
function newTrans(){return {id:uid(),out:"",in:"",outDur:0,inDur:0}}
function bt(title,dur,energy,beat,extra){return newBeat(Object.assign({title,dur,energy,beat},extra||{}))}
function emptySpeech(){return {title:"",speaker:"",audience:"",occasion:"",target:7,purpose:"",specific:"",central:""}}
function blankState(){return normalize({v:1,id:uid(),updatedAt:Date.now(),example:false,delivery:false,speech:emptySpeech(),
  blocks:[
    {kind:"opening",title:"",purpose:"",cols:[newCol([bt("Attention getter",30,7,"Make them want to listen."),bt("Credibility",20,4,"Why they should trust you on this."),bt("Preview",20,5,"Give them a map of what is coming.")])]},
    {kind:"act",title:"",purpose:"",cols:[newCol([newBeat({dur:90})])]},
    {kind:"act",title:"",purpose:"",cols:[newCol([newBeat({dur:90})])]},
    {kind:"act",title:"",purpose:"",cols:[newCol([newBeat({dur:90})])]},
    {kind:"closing",title:"",purpose:"",cols:[newCol([bt("Summary",30,6,"Repeat the central idea and the main points."),bt("Call to action / memorable close",30,8,"Say what you want them to do, then end cleanly.")])]}]})}

function exampleState(){
  const D=(type,desc)=>({id:uid(),type,desc});
  return normalize({v:1,id:uid(),updatedAt:Date.now(),example:true,delivery:true,
  speech:{title:"Make Wednesday Meeting-Free (example)",speaker:"Sample speaker",audience:"Team managers",occasion:"Leadership forum",target:7,purpose:"persuade",
    specific:"To persuade my audience of managers to trial one meeting-free Wednesday with their teams over the next four weeks.",
    central:"One protected day without meetings gives teams the focus to do their best work, and it costs almost nothing to try."},
  blocks:[
   {kind:"opening",title:"Hook them",purpose:"Win attention, earn trust and promise a payoff within the first minute.",cols:[{cards:[
     bt("The two calendars",25,7,"Create contrast and curiosity in the first sentence.",{
       say:"Picture next Wednesday with no meetings\nContrast it with this Wednesday: back-to-back\nAsk: which day ends with you proud of your work?",
       script:"Picture your calendar next Wednesday. No meetings. No pings. Nothing between you and the one hard thing you've been avoiding all month. Now picture your calendar this Wednesday. Back-to-back. Which of those two days ends with you proud of your work?",
       stage:"Pause three seconds after the first “No meetings.” Stand still. Look at the room, then at one person.",
       slides:[D("Image","Two calendars side by side: next Wednesday empty, this Wednesday packed")]}),
     bt("Why listen to me",15,4,"Credibility without a biography; admit that I used to be the sceptic.",{
       say:"I manage a 40-person team\nWe ran this for eight weeks last year\nI was the sceptic",
       notes:"All figures in this example are invented placeholders. Swap in your own numbers and sources."}),
     bt("Preview",20,5,"Give the audience a map so they can relax and follow.",{
       say:"Three parts: what is broken, what we tried, how you can try it\nPromise: you leave with one action for Monday",
       stage:"Count the three parts on your fingers.",
       slides:[D("Big phrase","Broken. Fixed. Try it.")]})]}],
     trans:{out:"So that is where we are headed. First, the problem.",outDur:3,in:"Let's start with your own Tuesday.",inDur:3}},
   {kind:"act",title:"Our days are chopped up",purpose:"Make the cost of constant meetings feel personal and measurable.",cols:[
     {title:"Look at your own week",summary:"A quick self-audit with the audience.",cards:[
       bt("Count your Tuesday",35,6,"Make the problem theirs before arguing anything.",{
         say:"Show of hands: back-to-back meetings yesterday?\nHow many hours of uninterrupted work did you get?\nMost of us: under one",
         stage:"Raise your own hand first. Scan the room and say “keep them up” with a smile. Wait for the laughter.",
         slides:[D("Chart / data","Hours of focus time per day in a typical week (placeholder data)")]}),
       bt("The price of switching",55,7,"Turn annoyance into a cost the audience believes.",{
         say:"Every interruption costs more than its length\nRefocus time is the hidden cost\nA 30-minute meeting at 2 pm can end the afternoon",
         notes:"Placeholder claim: refocusing can take 15 to 25 minutes. Replace with a source you trust before you present.",
         slides:[D("Quote","Short quote on refocus time, with the source named")]})]}],
     trans:{out:"That is the cost of the way we work now.",outDur:3,in:"So here is what we tried.",inDur:3}},
   {kind:"act",title:"One protected day fixes it",purpose:"Show a simple, concrete rule and the evidence that it works.",cols:[
     {title:"The rule",summary:"What we asked people to do.",cards:[
       bt("What Wednesday means",40,6,"Make the idea concrete in three short sentences.",{
         say:"No internal meetings, 9 to 5\nUrgent client calls are allowed\nCalendars blocked by default, not by request",
         slides:[D("Big phrase","No internal meetings. One day. Every week.")]})]},
     {title:"The proof",summary:"What happened.",cards:[
       bt("Our eight-week trial",65,8,"Evidence plus a human voice makes the claim credible.",{
         say:"Eight weeks, 14 people, one rule\nProjects shipped earlier than planned\nEveryone kept the rule; two people asked for a second day\nOne quote from a teammate",
         stage:"Step toward the audience for the teammate's quote. Slow down on the last sentence.",
         notes:"Example data only.",
         slides:[D("Chart / data","Before and after: tasks finished per week (placeholder)"),D("Quote","Teammate: “Wednesday is when I actually think.”")]})]}],
     trans:{out:"That is what happened for us.",outDur:4,in:"But you may be thinking: it won't work here.",inDur:3}},
   {kind:"act",title:"You can try it on Monday",purpose:"Remove the objections and shrink the first step until it is easy.",cols:[
     {title:"Objections",summary:"The one that matters most.",cards:[
       bt("“But our clients need us”",44,6,"Defuse the strongest objection before it forms.",{
         say:"Clients rarely need an answer within hours\nPost a one-line auto-reply and an urgent number\nWe lost no clients in eight weeks",
         slides:[D("Image","The one-line auto-reply on screen")]})]},
     {title:"First step",summary:"Make the ask small and specific.",cards:[
       bt("Try one Wednesday",40,8,"Give a small, specific action they can take today.",{
         say:"Pick one Wednesday this month\nBlock calendars today, not next week\nTell your team why in one sentence\nReview after four Wednesdays",
         props:[D("Handout","One-page checklist: how to run a meeting-free Wednesday")]})]}],
     trans:{out:"So the risk is small.",outDur:3,in:"Here is what I am asking you to remember.",inDur:4}},
   {kind:"closing",title:"Land it",purpose:"Repeat the one idea and make the next step unmistakable.",cols:[{cards:[
     bt("Summary",20,6,"A three-sentence recap of the three acts.",{
       say:"Our days are chopped into slivers\nOne protected day gives the focus back\nTrying it costs one calendar block"}),
     bt("Call to action: the empty Wednesday",35,9,"Echo the opening image and end on a direct ask.",{
       say:"Ask them to open their calendar now\nBlock next Wednesday before they leave the room\nReturn to the empty calendar from the opening",
       script:"Open your calendar. Right now. Find next Wednesday and block it. Call it focus, call it thinking, call it whatever you like. One day without meetings. Then watch what your team builds with it. Next Wednesday, the empty calendar from the start of this talk is yours. Thank you.",
       stage:"Open your own calendar as you say it. Slow down on the last line, then stop. Hold three seconds of silence before “Thank you.”",
       slides:[D("Image","The same empty Wednesday calendar from the opening")]})]}]}]})}

function normalize(st){
  st=st&&typeof st==="object"?st:{};
  st.v=1;st.id=st.id||uid();st.updatedAt=+st.updatedAt||Date.now();st.example=!!st.example;st.delivery=!!st.delivery;
  st.speech=Object.assign(emptySpeech(),st.speech||{});
  if(!PURPOSES.some(p=>p.k===st.speech.purpose))st.speech.purpose="";
  st.speech.target=Math.max(0,+st.speech.target||0);
  st.blocks=(Array.isArray(st.blocks)?st.blocks:[]).filter(b=>b&&typeof b==="object");
  st.blocks.forEach(b=>{b.id=b.id||uid();b.kind=["opening","act","closing"].includes(b.kind)?b.kind:"act";b.title=b.title||"";b.purpose=b.purpose||"";
    b.cols=Array.isArray(b.cols)?b.cols:[];if(!b.cols.length)b.cols.push(newCol());
    b.cols.forEach(col=>{col.id=col.id||uid();col.title=col.title||"";col.summary=col.summary||"";
      col.cards=(Array.isArray(col.cards)?col.cards:[]).map(s=>Object.assign(newBeat(),s,{slides:Array.isArray(s.slides)?s.slides:[],props:Array.isArray(s.props)?s.props:[],script:String(s.script||""),stage:String(s.stage||"")}));
      col.cards.forEach(s=>{s.id=s.id||uid();s.slides.forEach(f=>{f.id=f.id||uid();f.type=f.type||ST[0];f.desc=f.desc||""});s.props.forEach(f=>{f.id=f.id||uid();f.type=f.type||PT[0];f.desc=f.desc||""});
        s.dur=Math.max(0,+s.dur||0);s.energy=Math.min(10,Math.max(1,+s.energy||5))})})});
  if(!st.blocks.length)return blankState();
  /* one transition after every part except the last */
  st.blocks.forEach((b,i)=>{
    if(i<st.blocks.length-1){const t=b.trans&&typeof b.trans==="object"?b.trans:{};
      b.trans={id:t.id||uid(),out:String(t.out||""),in:String(t.in||""),outDur:Math.max(0,+t.outDur||0),inDur:Math.max(0,+t.inDur||0)}}
    else delete b.trans});
  return st}

function labelsFor(blocks){let n=0;return blocks.map(b=>{
  if(b.kind==="opening")return {label:"Opening",tag:"Opening",color:"var(--c-pro)",n:0};
  if(b.kind==="closing")return {label:"Closing",tag:"Closing",color:"var(--c-clo)",n:0};
  n++;return {label:"Act "+n,tag:"Body · Act "+n,color:"var(--c-"+ACTC[(n-1)%4]+")",n}})}
function layout(){
  const blocks=new Map(),cards=new Map(),trans=new Map(),list=[],labs=labelsFor(S.blocks);let t=0;
  S.blocks.forEach((b,bi)=>{
    const I=Object.assign({start:t},labs[bi]);
    b.cols.forEach((col,ci)=>col.cards.forEach((s,si)=>{
      const num=b.kind==="opening"?"O."+(si+1):b.kind==="closing"?"C."+(si+1):I.n+"."+(ci+1)+"."+(si+1);
      const info={s,b,q:col,num,start:t,color:I.color,blockLabel:I.label,colLabel:b.kind==="act"?"Segment "+(ci+1):""};
      cards.set(s.id,info);list.push(info);t+=s.dur||0}));
    I.end=t;blocks.set(b.id,I);
    if(b.trans){const d=(b.trans.outDur||0)+(b.trans.inDur||0),nx=labs[bi+1];
      trans.set(b.trans.id,{tr:b.trans,b,from:I.label,to:nx?nx.label:"",start:t,dur:d});t+=d}});
  return {blocks,cards,trans,list,total:t}}
function find(id){for(const b of S.blocks)for(const col of b.cols){const i=col.cards.findIndex(s=>s.id===id);if(i>=0)return {b,q:col,i,s:col.cards[i]}}return null}
function findCol(id){for(const b of S.blocks){const col=b.cols.find(x=>x.id===id);if(col)return {b,q:col}}return null}
function findTrans(id){for(const b of S.blocks)if(b.trans&&b.trans.id===id)return {b,tr:b.trans};return null}

/* ---------- render ---------- */
function renderShell(){
  const sp=S.speech;
  root.innerHTML=`<div class="wrap">
<header class="top">
  <div class="top-main">
    <div class="eyebrow">Speech spine</div>
    <input class="ghost h-title" id="f-title" value="${esc(sp.title)}" placeholder="Speech title" aria-label="Speech title">
    <textarea class="ghost h-log auto" id="f-central" rows="1" placeholder="Central idea: your whole speech in one sentence" aria-label="Central idea">${esc(sp.central)}</textarea>
    <div class="purpose-row"><span class="purpose-lab" id="purpose-lab">General purpose</span>
      <div class="purpose" role="radiogroup" aria-labelledby="purpose-lab">${PURPOSES.map(p=>`<button type="button" class="seg${sp.purpose===p.k?" on":""}" role="radio" aria-checked="${sp.purpose===p.k}" data-purpose="${p.k}">${p.label}</button>`).join("")}</div></div>
    <textarea class="ghost h-spec auto" id="f-specific" rows="1" placeholder="${esc(specificPlaceholder(sp.purpose))}" aria-label="Specific purpose statement">${esc(sp.specific)}</textarea>
    <div class="h-meta">
      <label class="g1">Speaker <input class="ghost f-speaker" id="f-speaker" value="${esc(sp.speaker)}" placeholder="Name"></label>
      <label class="g2">Audience <input class="ghost f-audience" id="f-audience" value="${esc(sp.audience)}" placeholder="Who is listening"></label>
      <label class="g2">Occasion / venue <input class="ghost f-occasion" id="f-occasion" value="${esc(sp.occasion)}" placeholder="Event, room"></label>
      <label>Target length <input class="ghost f-target" id="f-target" value="${esc(sp.target)}" inputmode="numeric"> min</label>
      <span class="runtime"></span>
    </div>
  </div>
  <label class="switch" for="f-delivery"><input type="checkbox" id="f-delivery"${S.delivery?" checked":""}><span>Delivery layer</span><small>slides · props · script · stage</small></label>
</header>
<div class="banner-slot"></div>
<div class="search" role="search">
  <div class="search-box"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 13l4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <input id="f-search" type="search" value="${esc(query)}" placeholder="Search cards, notes, scripts, transitions…" autocomplete="off" spellcheck="false" aria-label="Search this plan">
    <span class="search-count" aria-live="polite"></span><kbd class="search-key">Ctrl F</kbd></div>
  <div class="results" hidden></div>
</div>
<section>
  <div class="panel-h"><h2>Speech arc</h2><p class="hint">Each dot is a card, placed by running time and raised by energy. Diamonds mark transitions. Click a dot to edit that card.</p></div>
  <div class="arc-box"><div class="arc"></div></div>
</section>
<section>
  <div class="panel-h"><h2>Structure</h2><p class="hint">Opening, body acts, closing. Click a card to open it; drag cards to reorder; drag the right edge of a column or the bottom edge of a card to resize it. Transition cards between the parts hold your Out and In lines.</p></div>
  <div class="board-wrap"><div class="board"></div></div>
</section>
</div>
<aside class="drawer" hidden aria-label="Card editor"></aside>`;
  renderBanner();renderBoard();renderArc();renderDrawer();renderResults();updateRuntime();growAll(root);
  if(ro)ro.disconnect();ro=new ResizeObserver(()=>{renderArc();growAll(root)});ro.observe(q(".arc"));
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>root&&growAll(root));
  bindInner()}

/* ---------- search ---------- */
function terms(){return query.toLowerCase().split(/\s+/).filter(Boolean)}
function beatFields(s){return [["Title",s.title],["What I say",s.say],["Why it's here",s.beat],["Notes",s.notes],["Script",s.script],["Stage notes",s.stage],
  ...s.slides.map(f=>["Slide",[f.type,f.desc].filter(Boolean).join(" · ")]),...s.props.map(f=>["Prop",[f.type,f.desc].filter(Boolean).join(" · ")])]}
function hit(fields,T){const all=fields.map(f=>String(f[1]||"").toLowerCase()).join("\n");if(!T.every(t=>all.includes(t)))return null;
  return fields.find(f=>T.some(t=>String(f[1]||"").toLowerCase().includes(t)))}
function mark(text,T){const re=new RegExp("("+T.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")","gi");
  return String(text).split(re).map((p,i)=>i%2?"<mark>"+esc(p)+"</mark>":esc(p)).join("")}
function snippet(text,T){text=String(text).replace(/\s+/g," ");const low=text.toLowerCase();
  let i=Math.min(...T.map(t=>{const k=low.indexOf(t);return k<0?Infinity:k}));if(!isFinite(i))i=0;
  const a=Math.max(0,i-40),b=Math.min(text.length,i+90);return (a>0?"…":"")+mark(text.slice(a,b),T)+(b<text.length?"…":"")}
function matches(){
  const T=terms();if(!T.length)return null;
  const L=layout(),items=[],ids=new Set(),heads=new Set();
  S.blocks.forEach(b=>{const I=L.blocks.get(b.id);
    const bf=hit([["Title",b.title],["Purpose",b.purpose]],T);
    if(bf){heads.add(b.id);items.push({kind:"block",id:b.id,label:I.label,title:b.title||I.label,field:bf[0],snip:snippet(bf[1],T),color:I.color})}
    b.cols.forEach((col,ci)=>{
      if(b.kind==="act"){const qf=hit([["Title",col.title],["Summary",col.summary]],T);
        if(qf){heads.add(col.id);items.push({kind:"col",id:col.id,label:I.label+" · Segment "+(ci+1),title:col.title||"Segment "+(ci+1),field:qf[0],snip:snippet(qf[1],T),color:I.color})}}
      col.cards.forEach(s=>{const f=hit(beatFields(s),T);if(!f)return;const info=L.cards.get(s.id);ids.add(s.id);
        items.push({kind:"card",id:s.id,label:"Card "+info.num+" · "+info.blockLabel,title:s.title||"Untitled card",field:f[0],snip:snippet(f[1],T),color:info.color})})});
    if(b.trans){const TI=L.trans.get(b.trans.id),f=hit([["Out",b.trans.out],["In",b.trans.in]],T);
      if(f){ids.add(b.trans.id);items.push({kind:"trans",id:b.trans.id,label:"Transition",title:TI.from+" → "+TI.to,field:f[0],snip:snippet(f[1],T),color:"var(--muted)"})}}});
  return {ids,heads,items,T}}
function renderResults(){
  const box=q(".results"),cnt=q(".search-count"),M=matches();
  if(!M){box.hidden=true;box.innerHTML="";cnt.textContent="";return}
  cnt.textContent=M.items.length?M.items.length+(M.items.length===1?" match":" matches"):"No matches";
  box.hidden=false;
  box.innerHTML=M.items.length?M.items.slice(0,100).map(it=>`<button class="res" data-res="${it.kind}" data-id="${it.id}" style="--c:${it.color}"><span class="res-l">${esc(it.label)}</span><span class="res-t">${mark(it.title,M.T)}</span><span class="res-s"><em>${esc(it.field)}</em> ${it.snip}</span></button>`).join("")
    :`<p class="empty">Nothing in this plan matches “${esc(query)}”. Try fewer or different words.</p>`}
function showTrans(id){const el=root.querySelector("#tr-"+id);if(!el)return;
  el.scrollIntoView({block:"center",inline:"center",behavior:"smooth"});const ta=el.querySelector("textarea");if(ta)ta.focus({preventScroll:true})}
function openResult(btn){const id=btn.dataset.id,kind=btn.dataset.res;
  if(kind==="card"){open(id,true);return}
  if(kind==="trans"){showTrans(id);return}
  const el=root.querySelector(kind==="block"?"#bt-"+id:"#qt-"+id);
  if(el){el.scrollIntoView({block:"center",inline:"center",behavior:"smooth"});el.focus({preventScroll:true})}}

function renderBanner(){q(".banner-slot").innerHTML=S.example?`<div class="banner"><b>Example</b><span>“Make Wednesday Meeting-Free” is a sample 7-minute persuasive speech showing how the spine fills in. Edit it, or start a new plan from the menu.</span><button class="btn sm" data-act="dismiss-example">Hide this note</button></div>`:""}

function cardHTML(s,info,M){
  const hl=M?(M.ids.has(s.id)?" hit":" dim"):"";
  const dl=S.delivery?`<div class="chips"><span class="chip${s.slides.length?" on":""}">${s.slides.length} slide${s.slides.length===1?"":"s"}</span><span class="chip${s.props.length?" on":""}">${s.props.length} prop${s.props.length===1?"":"s"}</span><span class="chip${s.script.trim()?" on":""}">Script</span><span class="chip${s.stage.trim()?" on":""}">Stage</span></div>`:"";
  const h=+s.h>0?Math.min(900,Math.max(70,+s.h)):0;
  return `<article class="card${openId===s.id?" sel":""}${hl}${h?" sized":""}"${h?` style="height:${h}px"`:""} tabindex="0" role="button" draggable="true" data-scene="${s.id}" aria-label="Card ${info.num}: ${esc(s.title||"Untitled")}"><span class="card-grip" data-grip="card" title="Drag to resize. Double-click to reset." aria-hidden="true"></span>
<div class="card-top"><span class="num">${info.num}</span><span class="tc">${fmtTC(info.start)}</span></div>
<div class="card-title">${s.title?esc(s.title):'<span class="ph">Untitled card</span>'}</div>
${s.say?`<div class="card-sum">${esc(s.say)}</div>`:""}
<div class="card-foot"><span class="meter" title="Energy ${s.energy}/10"><i style="width:${s.energy*10}%"></i></span><span class="dur">${fmtDur(s.dur)}</span></div>${dl}</article>`}

function lenVal(v){return v?fmtDur(v):""}
function transHTML(TI,M){
  const tr=TI.tr,hl=M?(M.ids.has(tr.id)?" hit":" dim"):"";
  const line=(k,label,ph)=>`<div class="tl"><div class="tl-h"><label for="tl-${k}-${tr.id}">${label}</label><input class="tl-dur" id="tl-${k}Dur-${tr.id}" data-tf="${k}Dur" value="${lenVal(tr[k+"Dur"])}" placeholder="0:00" inputmode="numeric" title="Optional length: seconds (4) or m:ss" aria-label="${label} length"></div>
<textarea class="ghost auto" id="tl-${k}-${tr.id}" data-tf="${k}" rows="2" placeholder="${esc(ph)}">${esc(tr[k==="out"?"out":"in"])}</textarea></div>`;
  return `<aside class="trans${hl}" id="tr-${tr.id}" data-trans="${tr.id}" aria-label="Transition from ${esc(TI.from)} to ${esc(TI.to)}">
<div class="trans-top">${esc(TI.from)} → ${esc(TI.to)}</div>
${line("out","Out","Line that closes "+TI.from)}${line("in","In","Line that opens "+TI.to)}
<div class="trans-foot"><span class="tc">${fmtTC(TI.start)}</span><span class="dur">${TI.dur?fmtDur(TI.dur):"no time"}</span></div></aside>`}

function renderBoard(){
  const L=layout(),M=matches(),wrap=q(".board-wrap"),sl=wrap.scrollLeft;
  const acts=S.blocks.filter(b=>b.kind==="act").length;let h="";
  S.blocks.forEach((b,bi)=>{
    const I=L.blocks.get(b.id),isAct=b.kind==="act";
    const tph=isAct?"Main point of "+I.label:b.kind==="opening"?"Opening title (optional)":"Closing title (optional)";
    const pph=isAct?"What this act does for the speech":b.kind==="opening"?"What the opening has to achieve":"What the closing has to achieve";
    h+=`<section class="blk ${b.kind}${M&&M.heads.has(b.id)?" hit-h":""}" id="blk-${b.id}" style="--c:${I.color}">
<header class="blk-h"><div class="blk-tag"><span class="blk-name">${I.tag}</span><span class="tc">${fmtTC(I.start)}–${fmtTC(I.end)}</span></div>
<input class="ghost blk-title" id="bt-${b.id}" data-b="${b.id}" data-f="title" value="${esc(b.title)}" placeholder="${esc(tph)}" aria-label="${I.label} title">
<textarea class="ghost blk-purpose auto" id="bp-${b.id}" data-b="${b.id}" data-f="purpose" rows="1" placeholder="${esc(pph)}" aria-label="${I.label} purpose">${esc(b.purpose)}</textarea>
<div class="blk-actions">${isAct?`<button class="btn sm" data-act="add-col" data-b="${b.id}">+ Segment</button>`:""}${isAct&&acts>1?`<button class="btn sm danger" data-act="del-block" data-b="${b.id}" data-confirm="Click again to delete">Delete act</button>`:""}</div></header>
<div class="seqs">`;
    b.cols.forEach((col,ci)=>{
      const w=+col.w>0?Math.min(640,Math.max(180,+col.w)):0;
      h+=`<div class="seq${M&&M.heads.has(col.id)?" hit-h":""}"${w?` style="width:${w}px"`:""}><span class="seq-grip" data-grip="seq" data-q="${col.id}" title="Drag to resize. Double-click to reset." aria-hidden="true"></span>`;
      if(isAct)h+=`<div class="seq-h"><div class="seq-tag"><span>Segment ${ci+1}</span>${b.cols.length>1?`<button class="x" data-act="del-col" data-q="${col.id}" data-confirm="Delete?" aria-label="Delete segment">×</button>`:""}</div>
<input class="ghost seq-title" id="qt-${col.id}" data-q="${col.id}" data-f="title" value="${esc(col.title)}" placeholder="Segment title" aria-label="Segment title">
<textarea class="ghost seq-sum auto" id="qs-${col.id}" data-q="${col.id}" data-f="summary" rows="1" placeholder="What these cards cover" aria-label="Segment summary">${esc(col.summary)}</textarea></div>`;
      h+=`<div class="scenes" data-drop="${col.id}">${col.cards.map(s=>cardHTML(s,L.cards.get(s.id),M)).join("")}<button class="add-scene" data-act="add-card" data-q="${col.id}">+ Card</button></div></div>`});
    h+=`</div></section>`;
    const next=S.blocks[bi+1];
    if(isAct&&(!next||next.kind!=="act"))h+=`<button class="add-act" data-act="add-act" data-after="${b.id}">+ Act</button>`;
    if(b.trans)h+=transHTML(L.trans.get(b.trans.id),M)});
  q(".board").innerHTML=h;wrap.scrollLeft=sl;growAll(q(".board"))}

function smooth(p){if(p.length<2)return "";let d=`M${p[0][0]},${p[0][1]}`;
  for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c;
    d+=` C${(b[0]+(c[0]-a[0])/6).toFixed(1)},${(b[1]+(c[1]-a[1])/6).toFixed(1)} ${(c[0]-(e[0]-b[0])/6).toFixed(1)},${(c[1]-(e[1]-b[1])/6).toFixed(1)} ${c[0]},${c[1]}`}
  return d}
function renderArc(){
  const el=root&&q(".arc");if(!el)return;
  const W=Math.max(300,Math.floor(el.clientWidth)),H=W<640?210:250,m={l:34,r:16,t:50,b:30};
  const L=layout(),eff=s=>Math.max(s.dur||0,10),effT=d=>Math.max(d,4);
  let t=0;const pos=new Map(),tpos=[],bands=[];
  S.blocks.forEach(b=>{const I=L.blocks.get(b.id),b0=t,cuts=[];
    b.cols.forEach((col,ci)=>{if(ci>0)cuts.push(t);col.cards.forEach(s=>{pos.set(s.id,[t,eff(s)]);t+=eff(s)})});
    bands.push({b,I,x0:b0,x1:t,cuts});
    if(b.trans){const TI=L.trans.get(b.trans.id),d=effT(TI.dur);tpos.push({TI,mid:t+d/2});t+=d}});
  const target=(+S.speech.target||0)*60,span=Math.max(t,target,60);
  const X=v=>m.l+v/span*(W-m.l-m.r),Y=v=>m.t+(1-v/10)*(H-m.t-m.b),base=H-m.b;
  let g="";
  [0,5,10].forEach(v=>{g+=`<line x1="${m.l}" x2="${W-m.r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line)" stroke-dasharray="${v?"2 4":"0"}"/><text x="${m.l-8}" y="${Y(v)+3.5}" text-anchor="end" font-size="10" style="fill:var(--muted)">${v}</text>`});
  g+=`<text transform="translate(10 ${(m.t+base)/2}) rotate(-90)" text-anchor="middle" font-size="9.5" letter-spacing="1.2" style="fill:var(--muted)">ENERGY</text>`;
  if(target&&t>target)g+=`<rect x="${X(target)}" y="${m.t}" width="${X(t)-X(target)}" height="${base-m.t}" style="fill:var(--warn)" opacity=".08"/>`;
  bands.forEach(({b,I,x0,x1,cuts},k)=>{const a=X(x0),z=X(x1),w=z-a;
    g+=`<rect x="${a}" y="${m.t}" width="${Math.max(0,w)}" height="${base-m.t}" style="fill:${I.color}" opacity=".07"/>`;
    g+=`<rect x="${a}" y="${m.t-6}" width="${Math.max(0,w-1)}" height="3" style="fill:${I.color}"/>`;
    if(k>0)g+=`<line x1="${a}" x2="${a}" y1="${m.t-6}" y2="${base}" style="stroke:var(--line)"/>`;
    cuts.forEach(c=>{g+=`<line x1="${X(c)}" x2="${X(c)}" y1="${m.t}" y2="${base}" style="stroke:${I.color}" stroke-dasharray="2 3" opacity=".5"/>`});
    if(w>34){const lab=w>70?I.label.toUpperCase():(b.kind==="act"?I.n:I.label[0]);
      g+=`<text x="${a+4}" y="${m.t-30}" font-size="10" font-weight="700" letter-spacing="1.3" style="fill:${I.color};font-family:var(--f-display)">${esc(lab)}</text>`;
      const max=Math.floor((w-8)/6.4);let ti=b.title||"";if(ti.length>max)ti=max>3?ti.slice(0,max-1)+"…":"";
      if(ti)g+=`<text x="${a+4}" y="${m.t-15}" font-size="11.5" style="fill:var(--ink)">${esc(ti)}</text>`}});
  const steps=[60,120,300,600,900,1200,1800,3600];const step=steps.find(s=>span/s<=(W<640?5:9))||3600;
  for(let v=0;v<=span+1;v+=step)g+=`<line x1="${X(v)}" x2="${X(v)}" y1="${base}" y2="${base+4}" style="stroke:var(--muted)"/><text x="${X(v)}" y="${base+16}" text-anchor="${v===0?"start":"middle"}" font-size="10" style="fill:var(--muted);font-family:var(--f-mono)">${Math.round(v/60)}′</text>`;
  if(target){const tx=X(target);g+=`<line x1="${tx}" x2="${tx}" y1="${m.t}" y2="${base}" style="stroke:var(--ink)" stroke-dasharray="5 4" opacity=".55"/><text x="${tx-4}" y="${base-6}" text-anchor="end" font-size="10" style="fill:var(--muted);font-family:var(--f-mono)">target ${fmtDur(target)}</text>`}
  const pts=L.list.map(i=>{const [s0,d]=pos.get(i.s.id);return [+X(s0+d/2).toFixed(1),+Y(i.s.energy).toFixed(1),i]});
  const M=matches();
  if(pts.length){const p=pts.map(x=>[x[0],x[1]]),d=smooth(p);
    if(p.length>1)g+=`<path d="${d} L${p[p.length-1][0]},${base} L${p[0][0]},${base} Z" style="fill:var(--ink)" opacity=".05"/><path d="${d}" fill="none" style="stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/>`;
    pts.forEach(([x,y,i])=>{const sel=i.s.id===openId,on=M&&M.ids.has(i.s.id),off=M&&!on;
      if(on)g+=`<circle cx="${x}" cy="${y}" r="10" fill="none" style="stroke:var(--ink)" stroke-width="1.5"/>`;
      g+=`<circle class="dot" data-scene="${i.s.id}" cx="${x}" cy="${y}" r="${sel?8:5.5}" style="fill:${i.color};stroke:var(--panel)" stroke-width="2"${off?' opacity=".2"':""}><title>${esc(i.num+"  "+(i.s.title||"Untitled card")+"  ·  energy "+i.s.energy+"/10  ·  "+fmtDur(i.s.dur))}</title></circle>`})}
  else g+=`<text x="${W/2}" y="${H/2}" text-anchor="middle" style="fill:var(--muted)">Add a card to start drawing the arc</text>`;
  tpos.forEach(({TI,mid})=>{const x=+X(mid).toFixed(1),prev=[...pts].reverse().find(p=>p[0]<=x),next=pts.find(p=>p[0]>x);
    const y=prev&&next?(prev[1]+next[1])/2:prev?prev[1]:next?next[1]:base-12,tr=TI.tr,empty=!tr.out&&!tr.in&&!TI.dur,on=M&&M.ids.has(tr.id),off=M&&!on;
    if(on)g+=`<circle cx="${x}" cy="${y.toFixed(1)}" r="11" fill="none" style="stroke:var(--ink)" stroke-width="1.5"/>`;
    g+=`<path class="tmark" data-trans="${tr.id}" d="M${x},${(y-6.5).toFixed(1)} L${x+5.5},${y.toFixed(1)} L${x},${(y+6.5).toFixed(1)} L${x-5.5},${y.toFixed(1)} Z" style="fill:var(--ink);stroke:var(--panel)" stroke-width="2" opacity="${off?.2:empty?.5:1}"><title>${esc("Transition "+TI.from+" → "+TI.to+(TI.dur?"  ·  "+fmtDur(TI.dur):"")+(tr.out?"\nOut: "+tr.out:"")+(tr.in?"\nIn: "+tr.in:""))}</title></path>`});
  el.innerHTML=`<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Speech arc: card energy over running time">${g}</svg>`}

function scriptMeta(s){const n=words(s.script),sec=Math.round(n/WPM*60),long=s.dur&&sec>s.dur;
  return `<span class="vo-meta${long?" warn":""}">${n} words · ~${fmtDur(sec)} spoken at ${WPM} wpm${long?" · longer than this card's length":""}</span>`}
function itemRow(list,it,i){const types=list==="slides"?ST:PT;
  return `<div class="mi" data-list="${list}" data-i="${i}"><select id="${list}-t-${it.id}" data-k="type" aria-label="Type">${types.map(t=>`<option${t===it.type?" selected":""}>${t}</option>`).join("")}</select><input id="${list}-d-${it.id}" data-k="desc" value="${esc(it.desc)}" placeholder="${list==="slides"?"What the audience sees":"What you hold, play or hand out"}" aria-label="Description"><button class="x" data-act="del-item" aria-label="Remove">×</button></div>`}
function deliveryHTML(s){
  return `<div class="media"><h3>Delivery layer</h3>
<div class="mlist"><div class="mh"><span>Slides / visuals</span><button class="btn sm" data-act="add-item" data-list="slides">+ Slide</button></div>${s.slides.map((it,i)=>itemRow("slides",it,i)).join("")||'<p class="empty">No slides listed yet.</p>'}</div>
<div class="mlist"><div class="mh"><span>Props &amp; media</span><button class="btn sm" data-act="add-item" data-list="props">+ Prop</button></div>${s.props.map((it,i)=>itemRow("props",it,i)).join("")||'<p class="empty">No props or media listed yet.</p>'}</div>
<div class="mlist"><div class="mh"><span>Script</span><span class="vo-slot">${scriptMeta(s)}</span></div><textarea id="d-script" data-f="script" rows="4" class="vo auto" placeholder="Full text for this card, if you want to write it out">${esc(s.script)}</textarea></div>
<div class="mlist"><div class="mh"><span>Stage notes</span></div><textarea id="d-stage" data-f="stage" rows="2" class="auto" placeholder="Gestures, movement, pauses, audience interaction">${esc(s.stage)}</textarea></div></div>`}
function renderDrawer(focusSel){
  const d=q(".drawer");const f=openId&&find(openId);
  if(!f){openId=null;d.hidden=true;d.innerHTML="";return}
  const s=f.s,info=layout().cards.get(s.id);
  d.style.setProperty("--c",info.color);d.hidden=false;
  d.innerHTML=`<div class="dr-h"><div><div class="dr-tag">${info.blockLabel}${info.colLabel?" · "+info.colLabel:""} · Card ${info.num}</div><div class="tc d-tc">${fmtTC(info.start)} – ${fmtTC(info.start+(s.dur||0))}</div></div><button class="x big" data-act="close" aria-label="Close editor">×</button></div>
<div class="dr-body">
<label class="fld"><span>Title</span><input class="d-title" id="d-title" data-f="title" value="${esc(s.title)}" placeholder="Name this beat"></label>
<label class="fld"><span>What I say</span><textarea id="d-say" data-f="say" rows="3" class="auto" placeholder="Talking points, in the order I will say them">${esc(s.say)}</textarea></label>
<div class="row2"><label class="fld"><span>Energy <b class="d-int-v">${s.energy}</b> / 10</span><input type="range" id="d-energy" data-f="energy" min="1" max="10" step="1" value="${s.energy}"></label><label class="fld"><span>Length</span><input class="d-dur" id="d-dur" data-f="dur" value="${fmtDur(s.dur)}" inputmode="numeric" placeholder="90 or 1:30" title="Seconds (90), or minutes:seconds (1:30)"><small class="fld-hint">seconds, or m:ss</small></label></div>
<label class="fld"><span>Why it's here</span><textarea id="d-beat" data-f="beat" rows="2" class="auto" placeholder="What this card does for the speech">${esc(s.beat)}</textarea></label>
<label class="fld"><span>Notes</span><textarea id="d-notes" data-f="notes" rows="2" class="auto" placeholder="Research to do, open questions, reminders">${esc(s.notes)}</textarea></label>
${S.delivery?deliveryHTML(s):`<div class="media-off"><p>Slides, props, script and stage notes go in the delivery layer. Turn it on when the structure feels settled.</p><button class="btn sm" data-act="delivery-on">Turn on delivery layer</button></div>`}
<div class="dr-actions"><button class="btn sm" data-act="move" data-dir="-1">← Earlier</button><button class="btn sm" data-act="move" data-dir="1">Later →</button><span class="sp"></span><button class="btn sm danger" data-act="del-card" data-confirm="Click again to delete">Delete card</button></div>
</div>`;
  growAll(d);
  if(focusSel){const el=d.querySelector(focusSel);if(el)el.focus()}}

/* ---------- changes ---------- */
function changed(structural){
  S.updatedAt=Date.now();
  if(structural){renderBoard();renderDrawer()}
  renderArc();updateRuntime();if(query)renderResults();
  if(opts.onChange)opts.onChange(S)}
function updateRuntime(){const L=layout(),tg=(+S.speech.target||0)*60,diff=L.total-tg;
  q(".runtime").innerHTML=`Running time ${fmtDur(L.total)}${tg?` · ${diff>0?`<span class="over">${fmtDur(diff)} over</span>`:`${fmtDur(-diff)} under`}`:""} · ${L.list.length} cards`}
/* update timecodes in place, so a field being typed in keeps focus */
function refreshTime(){const L=layout();
  L.cards.forEach((i,id)=>{const el=root.querySelector(`.card[data-scene="${id}"] .tc`);if(el)el.textContent=fmtTC(i.start)});
  S.blocks.forEach(b=>{const I=L.blocks.get(b.id),el=root.querySelector(`#blk-${b.id} .blk-tag .tc`);if(el)el.textContent=fmtTC(I.start)+"–"+fmtTC(I.end)});
  L.trans.forEach((TI,id)=>{const el=root.querySelector(`#tr-${id}`);if(!el)return;el.querySelector(".tc").textContent=fmtTC(TI.start);el.querySelector(".dur").textContent=TI.dur?fmtDur(TI.dur):"no time"});
  const f=openId&&L.cards.get(openId),dt=q(".d-tc");if(f&&dt)dt.textContent=fmtTC(f.start)+" – "+fmtTC(f.start+(f.s.dur||0))}
function open(id,scroll){openId=id;renderBoard();renderArc();renderDrawer("#d-title");
  if(scroll){const c=root.querySelector(`.card[data-scene="${id}"]`);if(c)c.scrollIntoView({block:"nearest",inline:"center",behavior:"smooth"})}}
function closeDrawer(){if(!openId)return false;openId=null;renderDrawer();renderBoard();renderArc();return true}
function allCols(){const out=[];S.blocks.forEach(b=>b.cols.forEach(x=>out.push(x)));return out}
function moveTo(id,qid,refId,after){const f=find(id),tq=findCol(qid);if(!f||!tq)return;
  const [s]=f.q.cards.splice(f.i,1);let idx=tq.q.cards.length;
  if(refId){const r=tq.q.cards.findIndex(x=>x.id===refId);if(r>=0)idx=r+(after?1:0)}
  tq.q.cards.splice(idx,0,s);changed(true)}
function moveStep(dir){const f=find(openId);if(!f)return;const cols=allCols(),qi=cols.indexOf(f.q);
  if(dir<0){if(f.i>0)f.q.cards.splice(f.i-1,0,f.q.cards.splice(f.i,1)[0]);else if(qi>0)cols[qi-1].cards.push(f.q.cards.splice(f.i,1)[0]);else return}
  else{if(f.i<f.q.cards.length-1)f.q.cards.splice(f.i+1,0,f.q.cards.splice(f.i,1)[0]);else if(qi<cols.length-1)cols[qi+1].cards.unshift(f.q.cards.splice(f.i,1)[0]);else return}
  changed(true)}
function arm(btn,fn){if(btn.dataset.armed){fn();return}
  btn.dataset.armed="1";const old=btn.textContent;btn.textContent=btn.dataset.confirm||"Confirm";
  setTimeout(()=>{if(btn.isConnected&&btn.dataset.armed){delete btn.dataset.armed;btn.textContent=old}},3500)}
function grow(t){t.style.height="auto";t.style.height=t.scrollHeight+2+"px"}
function growAll(r){r.querySelectorAll("textarea.auto").forEach(grow)}

/* acts and their transitions: the Out line stays with the part it closes, the In line moves with the part it opens */
function addActAfter(id){const i=S.blocks.findIndex(b=>b.id===id),A=S.blocks[i];if(!A)return;
  const X={id:uid(),kind:"act",title:"",purpose:"",cols:[newCol()]};
  if(A.trans){X.trans={id:uid(),out:"",in:A.trans.in,outDur:0,inDur:A.trans.inDur};A.trans.in="";A.trans.inDur=0}
  S.blocks.splice(i+1,0,X)}
function removeBlock(id){const i=S.blocks.findIndex(b=>b.id===id),b=S.blocks[i],prev=S.blocks[i-1];if(!b)return;
  if(prev&&prev.trans&&b.trans){prev.trans.in=b.trans.in;prev.trans.inDur=b.trans.inDur}
  S.blocks.splice(i,1)}

/* ---------- events ---------- */
function onClick(e){
  if(e.target.closest("[data-grip]"))return;
  const dot=e.target.closest(".dot");if(dot){open(dot.dataset.scene,true);return}
  const tm=e.target.closest(".tmark");if(tm){showTrans(tm.dataset.trans);return}
  const pb=e.target.closest("[data-purpose]");if(pb){setPurpose(pb.dataset.purpose);return}
  const res=e.target.closest(".res");if(res){openResult(res);return}
  const a=e.target.closest("[data-act]");
  if(!a){const c=e.target.closest(".card");if(c)open(c.dataset.scene);return}
  const act=a.dataset.act;
  if(act==="add-card"){const f=findCol(a.dataset.q),s=newBeat();f.q.cards.push(s);openId=s.id;changed(true);renderArc();renderDrawer("#d-title")}
  else if(act==="add-col"){S.blocks.find(b=>b.id===a.dataset.b).cols.push(newCol());changed(true)}
  else if(act==="del-col")arm(a,()=>{const f=findCol(a.dataset.q);if(openId&&f.q.cards.some(s=>s.id===openId))openId=null;f.b.cols.splice(f.b.cols.indexOf(f.q),1);changed(true)});
  else if(act==="add-act"){addActAfter(a.dataset.after);changed(true)}
  else if(act==="del-block")arm(a,()=>{const b=S.blocks.find(x=>x.id===a.dataset.b);if(openId&&b&&b.cols.some(x=>x.cards.some(s=>s.id===openId)))openId=null;removeBlock(a.dataset.b);changed(true)});
  else if(act==="del-card")arm(a,()=>{const f=find(openId);if(f){f.q.cards.splice(f.i,1);openId=null;changed(true)}});
  else if(act==="move")moveStep(+a.dataset.dir);
  else if(act==="close")closeDrawer();
  else if(act==="delivery-on"){S.delivery=true;q("#f-delivery").checked=true;changed(true)}
  else if(act==="add-item"){const f=find(openId),list=a.dataset.list,it={id:uid(),type:list==="slides"?ST[0]:PT[0],desc:""};f.s[list].push(it);changed();renderBoard();renderDrawer(`#${list}-d-${it.id}`)}
  else if(act==="del-item"){const row=a.closest(".mi"),f=find(openId);f.s[row.dataset.list].splice(+row.dataset.i,1);changed();renderBoard();renderDrawer()}
  else if(act==="dismiss-example"){S.example=false;renderBanner();changed()}
}
function setPurpose(k){
  S.speech.purpose=S.speech.purpose===k?"":k;
  root.querySelectorAll("[data-purpose]").forEach(b=>{const on=b.dataset.purpose===S.speech.purpose;b.classList.toggle("on",on);b.setAttribute("aria-checked",String(on))});
  const sp=q("#f-specific");sp.placeholder=specificPlaceholder(S.speech.purpose);changed()}
function bindInner(){
  const board=q(".board"),drawer=q(".drawer"),search=q("#f-search");
  search.addEventListener("input",()=>{query=search.value;renderResults();renderBoard();renderArc()});
  search.addEventListener("keydown",e=>{
    if(e.key==="Enter"){const first=q(".res");if(first){e.preventDefault();openResult(first)}}
    else if(e.key==="Escape"&&search.value){e.preventDefault();e.stopPropagation();search.value="";query="";renderResults();renderBoard();renderArc()}});
  const HF={"f-title":"title","f-central":"central","f-specific":"specific","f-speaker":"speaker","f-audience":"audience","f-occasion":"occasion"};
  q(".top").addEventListener("input",e=>{const t=e.target;
    if(HF[t.id]){S.speech[HF[t.id]]=t.value;if(t.tagName==="TEXTAREA")grow(t)}
    else if(t.id==="f-target"){const v=parseInt(t.value,10);S.speech.target=isNaN(v)?0:Math.max(0,v)}
    else return;
    changed()});
  q("#f-delivery").addEventListener("change",e=>{S.delivery=e.target.checked;changed(true)});
  board.addEventListener("input",e=>{const t=e.target,tf=t.dataset.tf;
    if(tf){const f=findTrans(t.closest(".trans").dataset.trans);if(!f)return;
      if(tf==="outDur"||tf==="inDur"){const raw=t.value.trim(),v=raw===""?0:parseDur(raw);t.classList.toggle("bad",v===null);if(v===null)return;f.tr[tf]=v;refreshTime()}
      else{f.tr[tf]=t.value;grow(t)}
      changed();return}
    const k=t.dataset.f;if(!k)return;
    if(t.dataset.b)S.blocks.find(b=>b.id===t.dataset.b)[k]=t.value;else if(t.dataset.q)findCol(t.dataset.q).q[k]=t.value;
    if(t.tagName==="TEXTAREA")grow(t);changed()});
  board.addEventListener("change",e=>{const t=e.target;
    if(t.classList&&t.classList.contains("tl-dur")){const f=findTrans(t.closest(".trans").dataset.trans);if(f){t.value=lenVal(f.tr[t.dataset.tf]);t.classList.remove("bad")}}});
  board.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList&&e.target.classList.contains("tl-dur")){e.preventDefault();e.target.blur()}});
  drawer.addEventListener("input",e=>{const t=e.target,f=find(openId);if(!f)return;const s=f.s,row=t.closest(".mi");
    if(row){s[row.dataset.list][+row.dataset.i][t.dataset.k]=t.value;changed();renderBoard();return}
    const k=t.dataset.f;if(!k)return;
    if(k==="dur"){const v=parseDur(t.value);t.classList.toggle("bad",v===null);if(v===null)return;s.dur=v;refreshTime()}
    else if(k==="energy"){s.energy=+t.value;drawer.querySelector(".d-int-v").textContent=t.value}
    else s[k]=t.value;
    const vs=drawer.querySelector(".vo-slot");if(vs&&(k==="script"||k==="dur"))vs.innerHTML=scriptMeta(s);
    if(t.tagName==="TEXTAREA")grow(t);
    changed();renderBoard()});
  drawer.addEventListener("change",e=>{if(e.target.id==="d-dur"){const f=find(openId);if(f){e.target.value=fmtDur(f.s.dur);e.target.classList.remove("bad")}}});
  let rz=null;
  board.addEventListener("pointerdown",e=>{const g=e.target.closest("[data-grip]");if(!g)return;e.preventDefault();e.stopPropagation();
    const el=g.dataset.grip==="seq"?g.closest(".seq"):g.closest(".card"),r=el.getBoundingClientRect();
    rz={g,el,kind:g.dataset.grip,x:e.clientX,y:e.clientY,w:r.width,h:r.height,moved:false};
    try{g.setPointerCapture(e.pointerId)}catch(err){}el.classList.add("resizing")});
  board.addEventListener("pointermove",e=>{if(!rz)return;const dx=e.clientX-rz.x,dy=e.clientY-rz.y;if(Math.abs(dx)+Math.abs(dy)>2)rz.moved=true;
    if(rz.kind==="seq")rz.el.style.width=Math.round(Math.min(640,Math.max(180,rz.w+dx)))+"px";
    else{rz.el.style.height=Math.round(Math.min(900,Math.max(70,rz.h+dy)))+"px";rz.el.classList.add("sized")}});
  const endRz=()=>{if(!rz)return;const r=rz;rz=null;r.el.classList.remove("resizing");if(!r.moved)return;
    if(r.kind==="seq"){const f=findCol(r.g.dataset.q);if(f)f.q.w=parseInt(r.el.style.width,10)}
    else{const f=find(r.el.dataset.scene);if(f)f.s.h=parseInt(r.el.style.height,10)}
    changed()};
  board.addEventListener("pointerup",endRz);board.addEventListener("pointercancel",endRz);
  board.addEventListener("dblclick",e=>{const g=e.target.closest("[data-grip]");if(!g)return;e.stopPropagation();
    if(g.dataset.grip==="seq"){const f=findCol(g.dataset.q);if(f)delete f.q.w}else{const f=find(g.closest(".card").dataset.scene);if(f)delete f.s.h}
    changed(true)});
  board.addEventListener("dragstart",e=>{if(rz){e.preventDefault();return}const c=e.target.closest(".card");if(!c)return;dragId=c.dataset.scene;e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",dragId)}catch(err){}c.classList.add("dragging")});
  const clearMarks=()=>board.querySelectorAll(".drop-before,.drop-after,.drop-end").forEach(x=>x.classList.remove("drop-before","drop-after","drop-end"));
  board.addEventListener("dragend",()=>{dragId=null;clearMarks();board.querySelectorAll(".dragging").forEach(x=>x.classList.remove("dragging"))});
  board.addEventListener("dragover",e=>{if(!dragId)return;const z=e.target.closest(".scenes");if(!z)return;e.preventDefault();clearMarks();
    const c=e.target.closest(".card");
    if(c&&c.dataset.scene!==dragId){const r=c.getBoundingClientRect();c.classList.add(e.clientY<r.top+r.height/2?"drop-before":"drop-after")}else if(!c)z.classList.add("drop-end")});
  board.addEventListener("drop",e=>{if(!dragId)return;const z=e.target.closest(".scenes");if(!z)return;e.preventDefault();
    const c=e.target.closest(".card");let ref=null,after=false;
    if(c){if(c.dataset.scene===dragId){dragId=null;clearMarks();return}const r=c.getBoundingClientRect();after=e.clientY>=r.top+r.height/2;ref=c.dataset.scene}
    const id=dragId;dragId=null;moveTo(id,z.dataset.drop,ref,after)});
}

function mount(el,state,o){
  if(!root)document.addEventListener("keydown",e=>{
    const k=e.key.toLowerCase(),typing=/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement&&document.activeElement.tagName);
    if(((e.ctrlKey||e.metaKey)&&(k==="f"||k==="k"))||(k==="/"&&!typing&&!e.ctrlKey&&!e.metaKey)){
      const i=root&&root.querySelector("#f-search");if(i){e.preventDefault();i.focus();i.select()}}});
  if(root!==el){el.addEventListener("click",onClick);
    el.addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest(".card");if(c&&(e.key==="Enter"||e.key===" ")&&e.target===c){e.preventDefault();open(c.dataset.scene)}})}
  root=el;opts=o||{};S=normalize(state);openId=null;renderShell()}
function setState(st){S=normalize(st);openId=null;query="";renderShell()}
function getState(){return S}

return {mount,setState,getState,closeDrawer,normalize,blankState,exampleState,clone,esc,fmtDur,purposeLabel}
})();
