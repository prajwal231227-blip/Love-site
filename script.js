/* Utilities */
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

/* 1) Stars canvas */
(function stars(){
  const c = qs('#stars');
  if(!c) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const ctx = c.getContext('2d');
  let w, h, stars = [];

  function resize(){
    w = c.width = Math.floor(innerWidth * dpr);
    h = c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth+'px'; c.style.height = innerHeight+'px';
    stars = Array.from({length: Math.floor(innerWidth/3)}, () => ({
      x: Math.random()*w, y: Math.random()*h, r: (Math.random()*0.9+0.2)*dpr, a: Math.random()
    }));
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle='#9fd6ff';
    stars.forEach(s=>{
      s.a += 0.015 + Math.random()*0.01;
      const alpha = 0.3 + Math.sin(s.a)*0.25;
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  addEventListener('resize', resize, {passive:true});
  resize(); draw();
})();

/* 2) Petals (DOM sprites) */
(function petals(){
  const field = qs('.petal-field');
  if(!field) return;
  const dense = field.classList.contains('dense') ? 70 : 35;
  const frag = document.createDocumentFragment();
  for(let i=0;i<dense;i++){
    const p = document.createElement('span');
    const delay = (Math.random()*8).toFixed(2);
    const dur = (8+Math.random()*10).toFixed(2);
    p.className = 'petal';
    p.style.cssText = `
      position:fixed; top:-40px; left:${Math.random()*100}vw;
      width:${10+Math.random()*14}px; height:${10+Math.random()*14}px;
      background:radial-gradient(circle at 30% 30%, #bfe2ff, #3b79d4 60%);
      border-radius:50%;
      filter:drop-shadow(0 0 6px rgba(110,193,255,.7));
      opacity:${0.7+Math.random()*0.3};
      animation: fall ${dur}s linear ${delay}s infinite, sway ${ (4+Math.random()*4).toFixed(2) }s ease-in-out ${delay}s infinite alternate;
      pointer-events:none;
      z-index:-1;
    `;
    frag.appendChild(p);
  }
  field.appendChild(frag);
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fall { to { transform: translateY(110vh) rotate(260deg)} }
    @keyframes sway { from { margin-left:-18px } to { margin-left:18px } }
  `;
  document.head.appendChild(style);
})();

/* 3) Typewriter (index) */
(function typewriter(){
  const el = qs('#typewriter');
  if(!el) return;
  const full = el.textContent.trim();
  el.textContent = '';
  let i = 0;
  function tick(){
    el.textContent = full.slice(0, i++);
    if(i <= full.length) requestAnimationFrame(tick);
  }
  setTimeout(()=>requestAnimationFrame(tick), 400);
})();

/* 4) Reveal on scroll */
(function reveal(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, {threshold:0.15});
  qsa('[data-reveal]').forEach(n=>io.observe(n));
})();

/* 5) Heart opening (heart.html) */
(function heartOpen(){
  const btn = qs('#heart-open');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    document.body.classList.add('opening');
    // gentle music fade-in
    const audio = qs('#bgm');
    if(audio && audio.paused){
      audio.volume = 0; audio.play().catch(()=>{});
      let v = 0;
      const id = setInterval(()=>{ v+=0.05; audio.volume = Math.min(v, qs('#music-volume')?.value || 0.6); if(v>=0.6) clearInterval(id); }, 140);
    }
    // small burst of petals near heart
    burst(btn.getBoundingClientRect());
    btn.style.animation = 'none';
    btn.querySelector('.shine').style.animationDuration = '1.6s';
  });

  function burst(rect){
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    for(let i=0;i<18;i++){
      const s = document.createElement('span');
      s.className='petal';
      s.style.cssText = `
        position:fixed; left:${cx}px; top:${cy}px; width:14px; height:14px; border-radius:50%;
        background:radial-gradient(circle at 30% 30%, #bfe2ff, #3b79d4 60%);
        filter:drop-shadow(0 0 6px rgba(110,193,255,.9));
        pointer-events:none; z-index:5; transform:translate(-50%,-50%);
        transition: transform 1s ease-out, opacity 1.2s ease-out;
      `;
      document.body.appendChild(s);
      const ang = Math.random()*Math.PI*2;
      const dist = 120 + Math.random()*120;
      requestAnimationFrame(()=>{
        s.style.transform = `translate(${Math.cos(ang)*dist}px, ${Math.sin(ang)*dist}px) scale(${0.6+Math.random()*0.6})`;
        s.style.opacity = '0';
      });
      setTimeout(()=>s.remove(), 1300);
    }
  }
})();

/* 6) Music controls (heart.html) */
(function music(){
  const audio = qs('#bgm');
  const toggle = qs('#music-toggle');
  const vol = qs('#music-volume');
  if(!audio || !toggle || !vol) return;

  function updateBtn(){ toggle.textContent = audio.paused ? '▶' : '⏸'; }
  toggle.addEventListener('click', ()=>{
    if(audio.paused) audio.play().catch(()=>{}); else audio.pause();
    updateBtn();
  });
  vol.addEventListener('input', ()=> audio.volume = +vol.value);
  // mobile autoplay hint
  document.addEventListener('touchstart', oncePlay, {passive:true});
  function oncePlay(){ audio.play().catch(()=>{}); document.removeEventListener('touchstart', oncePlay); }
  audio.addEventListener('play', updateBtn); audio.addEventListener('pause', updateBtn);
})();

/* 7) Carousel + lightbox (heart.html) */
(function gallery(){
  const car = qs('#carousel');
  if(!car) return;
  const slides = qsa('.slide', car);
  let index = 0;
  const prev = qs('#prev'), next = qs('#next'), fs = qs('#fs');

  function go(i){
    index = (i+slides.length)%slides.length;
    const x = slides[index].offsetLeft - (car.clientWidth - slides[index].clientWidth)/2;
    car.scrollTo({left:x, behavior:'smooth'});
  }
  prev?.addEventListener('click', ()=>go(index-1));
  next?.addEventListener('click', ()=>go(index+1));
  // drag / swipe
  let sx=0, sl=0, isDown=false;
  car.addEventListener('pointerdown', e=>{isDown=true; sx=e.clientX; sl=car.scrollLeft; car.setPointerCapture(e.pointerId);});
  car.addEventListener('pointermove', e=>{if(isDown){car.scrollLeft = sl - (e.clientX - sx);}});
  car.addEventListener('pointerup', ()=>{isDown=false;});

  // Lightbox
  const lb = qs('#lightbox'), lbImg = qs('#lbImg'), lbCap = qs('#lbCap'), lbClose = qs('#lbClose');
  slides.forEach((f, i)=>{
    f.addEventListener('click', ()=>{
      lbImg.src = qs('img', f).src;
      lbCap.textContent = qs('figcaption', f)?.textContent || '';
      lb.classList.add('open'); index = i;
    });
  });
  lbClose?.addEventListener('click', ()=>lb.classList.remove('open'));
  lb?.addEventListener('click', e=>{ if(e.target === lb) lb.classList.remove('open'); });

  fs?.addEventListener('click', ()=>{
    lbImg.src = qs('img', slides[index]).src;
    lbCap.textContent = qs('figcaption', slides[index])?.textContent || '';
    lb.classList.add('open');
  });

  // Keyboard
  addEventListener('keydown', e=>{
    if(lb.classList.contains('open')){
      if(e.key==='Escape') lb.classList.remove('open');
      if(e.key==='ArrowLeft') go(index-1);
      if(e.key==='ArrowRight') go(index+1);
    }
  });
})();

/* 8) Hidden love notes (heart.html) */
(function notes(){
  const field = qs('#notesField');
  if(!field) return;
  const messages = [
  'I miss you already 💙',
  'You are my favorite person in the world.',
  'Distance can never change what we are.',
  'I am so proud of you every single day.',
  'You carry a piece of my heart with you.',
  'With you, everything feels peaceful.',
  'You are my forever feeling.',
  'Your smile is my safest place.',
  'You + your art = pure magic.',
];
  let msgIndex = 0;
  for(let i=0;i<14;i++){
    const r = document.createElement('button');
    r.className='note-rose';
    r.style.left = Math.random()*92 + '%';
    r.style.top  = Math.random()*82 + '%';
    r.setAttribute('aria-label','Secret note');
    field.appendChild(r);
    r.addEventListener('click', (e)=>{
      const pop = document.createElement('div');
      pop.className='note-pop';
      pop.textContent = messages[msgIndex];

      msgIndex = (msgIndex + 1) % messages.length;
      field.appendChild(pop);
      const rect = r.getBoundingClientRect();
      const fRect = field.getBoundingClientRect();
      let x = rect.left - fRect.left + rect.width / 2;
      let y = rect.top - fRect.top;

     // prevent going outside left/right
      x = Math.max(20, Math.min(x, fRect.width - 20));

// prevent going outside top/bottom
      y = Math.max(40, Math.min(y, fRect.height - 40));

      pop.style.left = x + 'px';
      pop.style.top = y + 'px';
      setTimeout(()=>pop.remove(), 2200);
    });
  }
})();
