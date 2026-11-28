/* ============================================================
   CONFIG — edit these before launch
   ============================================================ */
const CONFIG = {
  supabaseUrl: "https://bmrhejmutccvjzijuqae.supabase.co",
  supabaseAnonKey: "sb_publishable_4bBsCXlf8p8VlFGPB0D7KQ_UTl3yO-U",
  table: "rsvps",
  photos: false,            // true brings back the cloud wall + "add your face" upload
  instagram: "https://www.instagram.com/clouddsessions/",
  instagramHandle: "@clouddsessions",
  whatsappCommunity: "https://chat.whatsapp.com/F4xLBlFtvIXHB8HbvDQdzF",
  playlist: "https://music.apple.com/ng/playlist/cloudd-playlist/pl.u-yZyVDJLCdymA2rJ",
  eventDate: "2026-12-16T21:00:00+01:00",  // first edition start, Lagos time
  date: "WED 16 DECEMBER 2026",
  time: "9PM — 5AM",
  place: "amah studios, lagos",
  /* tickets: checkout happens on Tix Africa (it can't be embedded in another site) */
  ticketUrl: "https://tix.africa/discover/cloudd-sessions/checkout?step=tickets",
  ticketsFrom: "₦18,000"    // lowest price on sale; update when Early Bird sells out
};

/* photo wall switch */
if (!CONFIG.photos) document.querySelectorAll(".photos-only").forEach(el => { el.hidden = true; });

/* apply config copy */
if (CONFIG.instagram) { const a = document.getElementById("ig-link"); a.href = CONFIG.instagram; a.hidden = false; }
document.getElementById("ch-ig-h").textContent = CONFIG.instagramHandle;
[["ch-wa", CONFIG.whatsappCommunity, "Group link coming soon"], ["ch-ig", CONFIG.instagram, "Link coming soon"], ["ch-pl", CONFIG.playlist, "Playlist coming soon"]]
  .forEach(([id, url, soon]) => {
    const el = document.getElementById(id);
    if (url) { el.href = url; }
    else { el.classList.add("soon"); el.removeAttribute("target"); const c = el.querySelector(".cta"); if (c) c.innerHTML = soon; }
  });

/* dock appears once the hero button scrolls away, hides while the form is on screen */
(function dock(){
  const d = document.getElementById("dock"), cta = document.querySelector(".facts"), rsvp = document.getElementById("list"), tcta = document.querySelector(".trl-cta");
  let pastHero = false, atForm = false, atTrl = false;
  const set = () => d.classList.toggle("on", pastHero && !atForm && !atTrl);
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(cta);
  if (tcta) new IntersectionObserver(([e]) => { atTrl = e.isIntersecting; set(); }).observe(tcta);
  new IntersectionObserver(([e]) => { atForm = e.isIntersecting; set(); }, { threshold: .25 }).observe(rsvp);
})();

/* main actions become chrome clouds */
(function clouds(){
  const shapes = '<rect x="22" y="46" width="256" height="60" rx="30"/><circle cx="40" cy="76" r="27"/><circle cx="260" cy="76" r="27"/><circle cx="78" cy="50" r="30"/><circle cx="128" cy="40" r="35"/><circle cx="182" cy="38" r="36"/><circle cx="232" cy="52" r="29"/><circle cx="72" cy="90" r="22"/><circle cx="122" cy="94" r="22"/><circle cx="176" cy="94" r="22"/><circle cx="228" cy="90" r="22"/>';
  document.querySelectorAll("a.press, button.press").forEach((b, i) => {
    const lbl = document.createElement("span"); lbl.className = "lbl";
    while (b.firstChild) lbl.appendChild(b.firstChild);
    b.classList.add("cloud"); if (b.id === "submit" || b.id === "tk-go") b.classList.add("sm");
    b.innerHTML = `<svg class="cloud-bg" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="cg${i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="120">
        <stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="#f1f6fa"/><stop offset=".56" stop-color="#cfdde8"/><stop offset=".8" stop-color="#8fb6d6"/><stop offset="1" stop-color="#e4eef6"/>
      </linearGradient><filter id="cb${i}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>
      <g fill="none" stroke="#b8c6d2" stroke-width="11">${shapes}</g>
      <g fill="none" stroke="#0c1a28" stroke-width="5">${shapes}</g>
      <g fill="url(#cg${i})">${shapes}</g>
      <g fill="#fff" opacity=".9" filter="url(#cb${i})"><ellipse cx="128" cy="21" rx="20" ry="6"/><ellipse cx="184" cy="18" rx="22" ry="6"/><ellipse cx="78" cy="32" rx="13" ry="5"/><ellipse cx="232" cy="35" rx="12" ry="5"/></g>
    </svg>`;
    b.appendChild(lbl);
  });
})();

/* always open at the top so the opening plays in full */
try { if ("scrollRestoration" in history) history.scrollRestoration = "manual"; } catch(e){}
scrollTo(0, 0);

/* tagline letters */
(function tagline(){
  const el = document.getElementById("tagline"); let i = 0;
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w =>
    `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="ch" style="--i:${i++}">${c}</span>`).join("")}</span>`).join(" ");
})();

/* scroll reveals */
(function reveals(){
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting && e.boundingClientRect.top > 0) return;   // still below the screen
    io.unobserve(e.target); e.target.classList.add("in");
    setTimeout(() => e.target.classList.remove("rv", "in"), 1900);
  }), { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  /* anything jumped past (End key, fast flick) appears as well */
  const show = el => { io.unobserve(el); el.classList.add("in"); setTimeout(() => el.classList.remove("rv", "in"), 1900); };
  let tick = 0;
  addEventListener("scroll", () => { if (tick) return; tick = requestAnimationFrame(() => { tick = 0;
    document.querySelectorAll(".rv:not(.in)").forEach(el => { if (el.getBoundingClientRect().top < innerHeight * .9) show(el); }); }); }, { passive: true });
  ["main .rule", "main .step", ".ed-head", ".ed-side", ".wall", ".join-head", ".join-side", ".chan", "footer .big"].forEach(sel =>
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("rv");
      if (sel === "main .step" || sel === ".chan") el.style.setProperty("--rd", (i % 3) * .14 + "s");
      io.observe(el);
    }));
})();

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============================================================
   The chrome sky — liquid foil reflecting Lagos blue.
   The pointer is the sun: it lights and presses the surface.
   ============================================================ */
const sun = { x: .68, y: .28, tx: .68, ty: .28 };   // normalised, y down
const ripples = [];                                    // {x,y,t}
(function chrome(){
  const c = document.getElementById("chrome");
  const gl = c.getContext("webgl", { antialias:false, premultipliedAlpha:false });
  if (!gl){ c.style.background = "linear-gradient(160deg,#132d55,#0b1a30 45%,#061020 70%,#1c3a63)"; return; }

  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `
  precision highp float;
  uniform vec2 R; uniform float T; uniform vec2 S; uniform float I;
  uniform vec3 RP[4];
  float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
    return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y);}
  float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n2(p);p=m*p;a*=.5;}return v;}
  float H(vec2 p){
    float t=T*.025; vec2 o=p; p*=.32;
    vec2 q=vec2(fbm(p+vec2(0.,t)),fbm(p+vec2(5.2,-t)));
    float h=fbm(p*1.1+q*1.4+vec2(t*.6,0.));
    p=o;
    vec2 s=S*vec2(R.x/R.y,1.);
    float d=length(p-s);
    h-=.22*exp(-d*d*9.)*I;                         /* the sun presses the foil */
    for(int i=0;i<4;i++){
      vec3 r=RP[i]; if(r.z<0.) continue;
      float rd=length(p-r.xy*vec2(R.x/R.y,1.)); float age=r.z;
      h+=.07*sin(rd*34.-age*8.)*exp(-rd*3.)*exp(-age*1.4);
    }
    return h*I;
  }
  vec3 env(vec3 r){
    float y=r.y, x=r.x;
    vec3 skyTop=vec3(.16,.27,.46), sky=vec3(.07,.19,.40), deep=vec3(.02,.06,.16);
    vec3 grey=vec3(.09,.13,.21), dark=vec3(.015,.03,.08), white=vec3(.55,.76,1.);
    vec3 c=mix(deep,sky,smoothstep(-.6,.1,y));
    c=mix(c,skyTop,smoothstep(.15,.7,y));
    c=mix(c,dark,smoothstep(.06,.0,abs(y+.18))*.85);
    c=mix(c,white,smoothstep(.035,.0,abs(y-.42))*.9);
    c=mix(c,white,smoothstep(.05,.0,abs(x+.5+.15*y))*.55);
    vec3 g=mix(dark,white,smoothstep(-.7,.8,y+.25*x));
    g=mix(g,grey,.35);
    return mix(g,c,.38);
  }
  void main(){
    vec2 uv=gl_FragCoord.xy/R; vec2 p=vec2(uv.x*R.x/R.y,1.-uv.y);
    float e=3./R.y;
    float h=H(p);
    float hx=H(p+vec2(e,0.))-h, hy=H(p+vec2(0.,e))-h;
    /* pebbled foil grain: per-pixel, so it stays crisp */
    vec2 g1=floor(gl_FragCoord.xy), g2=floor(gl_FragCoord.xy*.5);
    float ga=h21(g1)-.5, gb=h21(g1+17.)-.5, gc=h21(g2+5.)-.5;
    vec3 n=normalize(vec3(-hx*1.5+ga*e*.03, hy*1.5+gb*e*.03, e));
    vec3 v=vec3(0.,0.,1.);
    vec3 r=reflect(-v,n);
    vec3 col=env(r);
    vec2 s=S*vec2(R.x/R.y,1.);
    vec3 L=normalize(vec3((s.x-p.x)*1.2,(p.y-s.y)*-1.2,.9));
    float spec=pow(max(dot(r,L),0.),60.);
    col+=vec3(.6,.85,1.)*spec*.9;
    col+=vec3(.35,.65,1.)*exp(-length(p-s)*2.2)*.16;
    col=mix(col,vec3(.02,.05,.14),.6); col+=vec3(.5,.75,1.)*spec*.3;                              /* harder metal contrast, night */
    float lum=dot(col,vec3(.3,.6,.1));
    col+=(ga*.03+gc*.018)*(.45+lum);                        /* grain sparkles in the highlights */
    col=mix(vec3(.04,.08,.16),col,I);
    float vig=smoothstep(1.4,.3,length(uv-.5));
    col*=mix(.80,1.,vig);
    gl_FragColor=vec4(col,1.);
  }`;
  function sh(t,s){const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);
    if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o;}
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(pr);gl.useProgram(pr);
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uR=gl.getUniformLocation(pr,"R"),uT=gl.getUniformLocation(pr,"T"),uS=gl.getUniformLocation(pr,"S"),
        uI=gl.getUniformLocation(pr,"I"),uRP=gl.getUniformLocation(pr,"RP");

  const SCALE = .8;
  function size(){
    const d=Math.min(devicePixelRatio||1,2)*SCALE;
    c.width=Math.max(2,Math.round(innerWidth*d)); c.height=Math.max(2,Math.round(innerHeight*d));
    gl.viewport(0,0,c.width,c.height);
  }
  size(); addEventListener("resize",size);

  const t0=performance.now();
  function frame(now){
    const t=(now-t0)/1000;
    sun.x+=(sun.tx-sun.x)*.06; sun.y+=(sun.ty-sun.y)*.06;
    const intro=reduce?1:Math.min(1,Math.max(0,(t-.1)/1.0)); const I=1-Math.pow(1-intro,3);
    gl.uniform2f(uR,c.width,c.height); gl.uniform1f(uT,reduce?8:t+8); gl.uniform2f(uS,sun.x,sun.y); gl.uniform1f(uI,I);
    const arr=new Float32Array(12).fill(-1);
    for(let i=0;i<4;i++){const r=ripples[i]; if(r){arr[i*3]=r.x;arr[i*3+1]=r.y;arr[i*3+2]=t-r.t;}}
    gl.uniform3fv(uRP,arr);
    gl.drawArrays(gl.TRIANGLES,0,3);
    for(let i=ripples.length-1;i>=0;i--) if(t-ripples[i].t>3.5) ripples.splice(i,1);
    window.__chromeT=t;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

function addRipple(clientX, clientY){
  ripples.unshift({ x: clientX/innerWidth, y: clientY/innerHeight, t: window.__chromeT||0 });
  ripples.length = Math.min(ripples.length, 4);
}

/* sun follows pointer; idle sun drifts in a slow arc like the afternoon */
let lastMove = 0;
addEventListener("pointermove", e => { sun.tx = e.clientX/innerWidth; sun.ty = e.clientY/innerHeight; lastMove = performance.now(); }, { passive:true });
addEventListener("pointerdown", e => addRipple(e.clientX, e.clientY), { passive:true });

/* the logo tilts toward the sun and carries its glint */
const logo = document.getElementById("logo");
const glint = logo.querySelector(".glint");
let tilt = { x:0, y:0 }, landed = true;

/* opening sequence: water ripples, logo fades in at screen centre, then rises into place */
(function opening(){
  const root = document.documentElement;
  if (!root.classList.contains("intro")) return;
  const cell = document.querySelector(".logo-cell");
  const r = cell.getBoundingClientRect();
  cell.style.setProperty("--dy", (innerHeight/2 - (r.top + r.height/2)).toFixed(1) + "px");
  const cx = innerWidth/2, cy = innerHeight/2;
  root.style.overflow = "hidden";
  setTimeout(() => { if (document.getElementById("list").hidden) root.style.overflow = ""; }, 4300);
  setTimeout(() => addRipple(cx, cy), 250);
  setTimeout(() => addRipple(cx*.6, cy*1.2), 800);
  setTimeout(() => root.classList.add("s1"), 1100);
  setTimeout(() => { root.classList.add("s2"); addRipple(cx, cy); }, 2800);
  setTimeout(() => { root.classList.remove("intro","s1","s2"); }, 6200);
})();
(function logoLoop(now){
  if (!reduce){
    if (now - lastMove > 2500){ const k = now/9000; sun.tx = .5 + Math.cos(k)*.32; sun.ty = .3 + Math.sin(k*1.3)*.12; }
    const r = logo.getBoundingClientRect();
    const sx = sun.x*innerWidth, sy = sun.y*innerHeight;
    const dx = (sx - (r.left + r.width/2)) / innerWidth, dy = (sy - (r.top + r.height/2)) / innerHeight;
    tilt.x += ((-dy*10) - tilt.x)*.08; tilt.y += ((dx*14) - tilt.y)*.08;
    const bob = Math.sin(now/1400)*6;
    if (landed) logo.style.transform = `translateY(${bob}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`;
    glint.style.setProperty("--gx", (((sx - r.left)/r.width)*100).toFixed(1) + "%");
    glint.style.setProperty("--gy", (((sy - r.top)/r.height)*100).toFixed(1) + "%");
  }
  requestAnimationFrame(logoLoop);
})(0);

/* ============================================================
   RSVP
   ============================================================ */
const form = document.getElementById("rsvp-form");
const btn = document.getElementById("submit");
const msg = document.getElementById("form-msg");
const pass = document.getElementById("pass");
const wall = document.getElementById("wall-grid");
const live = !!(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
const sbHeaders = { apikey: CONFIG.supabaseAnonKey, Authorization: `Bearer ${CONFIG.supabaseAnonKey}` };

/* playlist bars */

const esc = t => String(t).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

/* a face inside a chrome cloud */
let cloudN = 0;
function faceSVG({ photo, glyph, plus }){
  const n = ++cloudN;
  const shapes = '<circle cx="120" cy="100" r="62"/><circle cx="66" cy="112" r="44"/><circle cx="174" cy="112" r="44"/><circle cx="88" cy="66" r="44"/><circle cx="150" cy="62" r="48"/><circle cx="104" cy="140" r="40"/><circle cx="150" cy="138" r="40"/>';
  return `<svg viewBox="0 0 240 190" aria-hidden="true">
    <defs><clipPath id="fc${n}">${shapes}</clipPath>
    <linearGradient id="fg${n}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="190">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#eef4f8"/><stop offset=".6" stop-color="#c9d9e5"/><stop offset=".82" stop-color="#8fb6d6"/><stop offset="1" stop-color="#e4eef6"/>
    </linearGradient><filter id="fb${n}" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="4"/></filter></defs>
    <g fill="none" stroke="#dfe8ef" stroke-width="13">${shapes}</g>
    <g fill="none" stroke="#0c1a28" stroke-width="5">${shapes}</g>
    <g fill="url(#fg${n})">${shapes}</g>
    ${photo ? `<image href="${esc(photo)}" x="0" y="0" width="240" height="190" preserveAspectRatio="xMidYMid slice" clip-path="url(#fc${n})"/>
               <g fill="#fff" opacity=".45" filter="url(#fb${n})"><ellipse cx="150" cy="30" rx="26" ry="6"/><ellipse cx="88" cy="36" rx="18" ry="5"/></g>`
            : `<text class="${plus ? "plus" : ""}" x="120" y="${plus ? 128 : 126}" text-anchor="middle">${esc(glyph)}</text>`}
  </svg>`;
}
function cardHTML({ name, no, photo }, cls = ""){
  const first = name.trim().split(/\s+/)[0] || "Guest";
  return `<figure class="cface ${cls}">${faceSVG({ photo, glyph: first[0].toUpperCase() })}
    <figcaption><b>${esc(first)}</b></figcaption>${no == null ? "" : `<span class="mono">Nº ${esc(String(no).padStart(4, "0"))}</span>`}</figure>`;
}
wall.innerHTML = `<a class="cface add" href="#list">${faceSVG({ glyph: "+", plus: true })}<b>Add yours</b><span class="mono">Join the list with a photo</span></a>`;
document.getElementById("drop-pic").innerHTML = faceSVG({ glyph: "+", plus: true });
function addToWall(entry){ wall.querySelector(".cface.add").insertAdjacentHTML("afterend", cardHTML(entry, "real")); }

/* the cloud list opens only when asked for */
const sheet = document.getElementById("list");
let lastFocus = null, sheetTimer = 0;
function openSheet(ev){
  clearTimeout(sheetTimer); lastFocus = document.activeElement;
  sheet.hidden = false; document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => sheet.classList.add("on"));
  if (ev && ev.clientX) addRipple(ev.clientX, ev.clientY);
  setTimeout(() => { const f = form.hidden ? pass : document.getElementById("f-name"); f.focus({ preventScroll: true }); }, 60);
}
function closeSheet(){
  sheet.classList.remove("on"); document.documentElement.style.overflow = "";
  sheetTimer = setTimeout(() => { sheet.hidden = true; }, 320);
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href="#list"]');
  if (a){ e.preventDefault(); openSheet(e); }
});
sheet.addEventListener("click", e => { if (e.target === sheet || e.target.classList.contains("sheet-in")) closeSheet(); });
document.getElementById("sheet-x").addEventListener("click", closeSheet);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
document.querySelector(".done-link").addEventListener("click", closeSheet);
if (CONFIG.whatsappCommunity){ const w = document.getElementById("pop-wa"); w.href = CONFIG.whatsappCommunity; w.hidden = false; }

/* cloudy edge: soft puffs around the popup, redrawn whenever it changes size */
function cloudEdge(pop, puffs){
  const draw = () => drawPuffs(pop, puffs);
  new ResizeObserver(draw).observe(pop);
}
function drawPuffs(pop, puffs){
  const w = pop.offsetWidth, h = pop.offsetHeight; if (!w || !h) return;
  const small = innerWidth < 520, base = small ? 58 : 92, vary = small ? 22 : 40, inset = small ? 16 : 26, step = small ? 44 : 62;
  let out = "<b></b>", n = 0;
  const dot = (x, y) => { const d = base + vary * (Math.sin(++n * 2.4) * .5 + .5); out += `<i style="left:${(x - d/2).toFixed(0)}px;top:${(y - d/2).toFixed(0)}px;width:${d.toFixed(0)}px;height:${d.toFixed(0)}px"></i>`; };
  for (let x = inset; x <= w - inset; x += step){ dot(x, inset); dot(x, h - inset); }
  for (let y = inset + step; y < h - inset; y += step){ dot(inset, y); dot(w - inset, y); }
  puffs.innerHTML = out;
}
cloudEdge(document.getElementById("pop"), document.getElementById("puffs"));
cloudEdge(document.getElementById("tk-pop"), document.getElementById("tk-puffs"));

/* tickets: a CLOUDD pop-up with the details; checkout itself happens on Tix Africa */
const tkSheet = document.getElementById("tickets");
let tkLast = null, tkTimer = 0;
document.getElementById("tk-date").textContent = CONFIG.date;
document.getElementById("tk-time").textContent = CONFIG.time;
document.getElementById("tk-place").textContent = CONFIG.place;
document.getElementById("tk-from").textContent = `From ${CONFIG.ticketsFrom}`;
document.getElementById("tk-card").href = CONFIG.ticketUrl;
document.getElementById("tk-go").href = CONFIG.ticketUrl;
function openTickets(ev){
  clearTimeout(tkTimer); tkLast = document.activeElement;
  tkSheet.hidden = false; document.documentElement.style.overflow = "hidden";
  requestAnimationFrame(() => tkSheet.classList.add("on"));
  if (ev && ev.clientX) addRipple(ev.clientX, ev.clientY);
  setTimeout(() => document.getElementById("tk-go").focus({ preventScroll: true }), 60);
}
function closeTickets(){
  tkSheet.classList.remove("on"); document.documentElement.style.overflow = "";
  tkTimer = setTimeout(() => { tkSheet.hidden = true; }, 320);
  if (tkLast && tkLast.focus) tkLast.focus({ preventScroll: true });
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href="#tickets"]');
  if (a){ e.preventDefault(); if (!sheet.hidden) closeSheet(); openTickets(e); }
});
tkSheet.addEventListener("click", e => { if (e.target === tkSheet) closeTickets(); });
document.getElementById("tk-x").addEventListener("click", closeTickets);
document.addEventListener("keydown", e => { if (e.key === "Escape" && !tkSheet.hidden) closeTickets(); });

/* photo: crop to the card's 4:5 window and shrink before it goes anywhere */
let photoData = null;
const photoInput = document.getElementById("f-photo");
function cropPhoto(file){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const W = 720, H = 570, c = document.createElement("canvas"); c.width = W; c.height = H;
      const k = Math.max(W / img.width, H / img.height), w = img.width * k, h = img.height * k;
      c.getContext("2d").drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", .85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image")); };
    img.src = url;
  });
}
photoInput.addEventListener("change", async () => {
  const f = photoInput.files[0]; setErr("e-photo");
  if (!f) return;
  if (!f.type.startsWith("image/")){ setErr("e-photo", null, "Choose a photo (JPG or PNG)."); return; }
  if (f.size > 12 * 1024 * 1024){ setErr("e-photo", null, "That photo is over 12 MB. Choose a smaller one."); return; }
  try {
    photoData = await cropPhoto(f);
    document.getElementById("drop-pic").innerHTML = faceSVG({ photo: photoData });
    document.getElementById("drop-b").textContent = "Photo added";
  } catch(e){ setErr("e-photo", null, "Couldn't read that photo. Try another one."); }
});

function setErr(id, inputId, text){
  document.getElementById(id).textContent = text || "";
  if (inputId) document.getElementById(inputId).setAttribute("aria-invalid", text ? "true" : "false");
}
function normPhone(v){
  let d = v.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("234")) return "+" + d;
  if (d.startsWith("0") && d.length === 11) return "+234" + d.slice(1);
  return d;
}
function validate(data){
  let ok = true;
  setErr("e-name","f-name"); setErr("e-email","f-email"); setErr("e-wa","f-wa"); setErr("e-consent");
  if (data.name.trim().length < 2){ setErr("e-name","f-name","Enter your full name."); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())){ setErr("e-email","f-email","Enter an email like you@email.com."); ok = false; }
  const digits = data.whatsapp.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15){ setErr("e-wa","f-wa","Enter a WhatsApp number, e.g. 0803 123 4567."); ok = false; }
  if (!data.consent){ setErr("e-consent", null, "Tick the box so we can send you updates."); ok = false; }
  return ok;
}

async function saveSignup(row){
  if (!live){
    /* preview mode: no backend yet */
    await new Promise(r => setTimeout(r, 900));
    let n = 147; try { n = Number(localStorage.getItem("cloudd_demo_no") || 146) + 1; localStorage.setItem("cloudd_demo_no", n); } catch(e){}
    return { pass_no: n, duplicate: false };
  }
  let photoPath = null;
  if (row.photo && CONFIG.photos){
    const blob = await (await fetch(row.photo)).blob();
    photoPath = `${crypto.randomUUID()}.jpg`;
    const up = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/faces/${photoPath}`, { method: "POST", headers: { ...sbHeaders, "Content-Type": "image/jpeg" }, body: blob });
    if (!up.ok) photoPath = null;      // the signup matters more than the photo
  }
  const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/join_list`, {
    method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ p_name: row.name, p_email: row.email, p_whatsapp: row.whatsapp, p_instagram: row.instagram || null, p_photo: photoPath })
  });
  if (!res.ok){
    const body = await res.json().catch(() => ({}));
    throw new Error(/too many/i.test(body.message || "") ? "busy" : "save");
  }
  const out = await res.json();   // RETURNS TABLE -> [{ pass_no, duplicate }]
  return Array.isArray(out) ? (out[0] || {}) : out;
}

/* the shared wall: everyone on the list who added a photo */
(async function loadWall(){
  if (!live || !CONFIG.photos) return;
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/list_wall`, { method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json" }, body: "{}" });
    if (!res.ok) return;
    (await res.json()).reverse().forEach(r => addToWall({ name: r.first_name, no: r.pass_no, photo: `${CONFIG.supabaseUrl}/storage/v1/object/public/faces/${r.photo_path}` }));
  } catch(e){}
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (form.company.value) return;              // bot
  const data = {
    name: form.name.value, email: form.email.value, whatsapp: form.whatsapp.value,
    instagram: "", consent: form.consent.checked
  };
  if (!validate(data)){ const first = form.querySelector('[aria-invalid="true"]'); first && first.focus(); return; }

  btn.disabled = true; msg.textContent = "Adding you to the list…";
  const r = btn.getBoundingClientRect(); addRipple(r.left + r.width/2, r.top + r.height/2);
  try {
    const out = await saveSignup({ name: data.name.trim(), email: data.email.trim().toLowerCase(), whatsapp: normPhone(data.whatsapp), instagram: data.instagram, photo: photoData });
    const entry = { name: data.name, no: out.pass_no, photo: photoData };
    document.getElementById("my-card").innerHTML = cardHTML(entry);
    if (out.duplicate){
      document.getElementById("p-head").textContent = "You're already on the cloud list.";
      document.getElementById("p-copy").textContent = "This email is already on the list. We'll email and WhatsApp you set times and day-of updates.";
    } else if (photoData && CONFIG.photos){ addToWall(entry); }
    form.hidden = true; pass.hidden = false; pass.classList.add("reveal"); pass.focus({ preventScroll:true });
    const pr = pass.getBoundingClientRect();
    for (let i = 0; i < 3; i++) setTimeout(() => addRipple(pr.left + pr.width*(.2 + .3*i), pr.top + pr.height/2), i*180);
  } catch(err){
    msg.textContent = err.message === "busy"
      ? "Lots of signups right now. Wait a few minutes and try again."
      : "Couldn't save. Check your connection and try again.";
  } finally { btn.disabled = false; if (form.hidden) msg.textContent = ""; }
});
