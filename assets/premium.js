/* Dra. Kelly Barbi — camada premium (complementa o main.js) */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Título da hero palavra por palavra (texto continua igual para SEO/leitores) */
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduced && !h1.dataset.split) {
    h1.dataset.split = '1';
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute('aria-label', h1.textContent.trim());
    h1.innerHTML = words
      .map((w, i) => `<span class="w${i > words.findIndex(x => x.endsWith(':')) && words.some(x => x.endsWith(':')) ? ' acc' : ''}" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`)
      .join(' ');
  }

  /* 2. Hero em tela cheia: ativa sozinha quando a imagem do Google Flow existir em assets/
        (hero-dra-kelly-barbi-{1280,1920,2752}.webp/.avif e hero-mobile-dra-kelly-barbi-{828,1229}) */
  const hero = document.querySelector('.hero');
  const slot = document.querySelector('.hero-bg');
  if (hero && slot) {
    const base = 'assets/hero-dra-kelly-barbi';
    const mob = 'assets/hero-mobile-dra-kelly-barbi';
    const ws = [1280, 1920, 2752];
    const wm = [828, 1229];
    const set = (b, arr, ext) => arr.map(w => `${b}-${w}.${ext} ${w}w`).join(', ');
    const probe = new Image();
    probe.onload = () => {
      slot.innerHTML = `<picture>
        <source media="(max-width: 760px)" type="image/avif" srcset="${set(mob, wm, 'avif')}" sizes="100vw">
        <source media="(max-width: 760px)" type="image/webp" srcset="${set(mob, wm, 'webp')}" sizes="100vw">
        <source type="image/avif" srcset="${set(base, ws, 'avif')}" sizes="100vw">
        <img src="${base}-1920.webp" srcset="${set(base, ws, 'webp')}" sizes="100vw" alt="" decoding="async" fetchpriority="high">
      </picture>`;
      const head = document.querySelector('.topbar');
      if (head) document.documentElement.style.setProperty('--kb-head', head.offsetHeight + 'px');
      hero.classList.add('hero--full');
      if (!hero.querySelector('.hero-chip')) {
        const chip = document.createElement('div');
        chip.className = 'hero-chip';
        chip.setAttribute('aria-hidden', 'true');
        chip.innerHTML = '<b>5,0</b><span><span class="stars">★★★★★</span>76 avaliações no Google</span>';
        hero.appendChild(chip);
      }
    };
    probe.src = `${base}-1280.webp`;
  }

  /* 3. Faixa contínua de serviços */
  const track = document.querySelector('.service-strip .service-items');
  if (track && !reduced && !track.dataset.loop) {
    track.dataset.loop = '1';
    const items = [...track.children];
    for (let k = 0; k < 2; k++) {
      items.forEach(it => {
        const c = it.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
    }
  }

  /* 4. Avatares com inicial nas avaliações */
  document.querySelectorAll('.review cite').forEach(c => {
    if (c.querySelector('.kb-avatar')) return;
    const nome = c.textContent.trim();
    const a = document.createElement('span');
    a.className = 'kb-avatar';
    a.setAttribute('aria-hidden', 'true');
    a.textContent = nome.charAt(0).toUpperCase();
    c.prepend(a);
  });

  /* 5. Contadores (5,0 e 76) e estrelas que se preenchem ao aparecer */
  const counters = [
    ...document.querySelectorAll('[data-count]'),
    ...document.querySelectorAll('.google-proof .score'),
  ];
  const ratingStrong = document.querySelector('.rating-copy strong');
  if (ratingStrong) counters.push(ratingStrong);
  const stars = [...document.querySelectorAll('.reviews .stars, .hero-rating .stars')];
  stars.forEach(s => s.classList.add('kb-fill'));

  const animateNum = el => {
    const txt = el.textContent;
    const m = txt.match(/(\d+)(?:,(\d+))?/);
    if (!m || reduced) return;
    const casas = m[2] ? m[2].length : 0;
    const alvo = parseFloat(m[1] + (m[2] ? '.' + m[2] : ''));
    const t0 = performance.now();
    const dur = 1600;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 4);
      const v = (alvo * e).toFixed(casas).replace('.', ',');
      el.textContent = txt.replace(m[0], v);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = txt;
    };
    requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        if (el.classList.contains('kb-fill')) el.classList.add('is-on');
        else animateNum(el);
        obs.unobserve(el);
      });
    }, { threshold: 0.4 });
    [...counters, ...stars].forEach(el => io.observe(el));
  } else {
    stars.forEach(s => s.classList.add('is-on'));
  }
})();

/* 6. Dobra 2: entrada da foto e dos cards */
(() => {
  const els = document.querySelectorAll('.kb2-media, .kb2-card');
  if (!els.length || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('kb-js');
  const io = new IntersectionObserver((en, obs) => en.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
  }), { threshold: 0.18 });
  els.forEach(el => io.observe(el));
})();

/* 7. Avaliações: anel e estrelas ao aparecer + faixas de temas ligadas à rolagem */
(() => {
  const sec = document.querySelector('.kb-av');
  if (!sec) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = sec.querySelectorAll('.kb-av-nota, .kb-quote');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('kb-js');
    const io = new IntersectionObserver((en, obs) => en.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    }), { threshold: 0.3 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('is-in'));
  if (reduced) return;
  let raf = 0;
  const upd = () => {
    raf = 0;
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    sec.style.setProperty('--kb-b1', (-30 * p).toFixed(2) + '%');
    sec.style.setProperty('--kb-b2', (-30 + 30 * p).toFixed(2) + '%');
    sec.style.setProperty('--kb-par', (60 - 120 * p).toFixed(1) + 'px');
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  upd();
})();

/* 8. Sobre: revelação da foto, título blur-in e parallax da foto/selo ligados à rolagem */
(() => {
  const sec = document.querySelector('.kb-sobre');
  if (!sec) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h2 = sec.querySelector('.kb-blur');
  if (h2 && !h2.dataset.split) {
    h2.dataset.split = '1';
    const t = h2.textContent.trim();
    h2.setAttribute('aria-label', t);
    h2.innerHTML = t.split(/\s+/).map((w, i) => `<span class="bw" aria-hidden="true" style="--i:${i}">${w}</span>`).join(' ');
  }
  const targets = [sec, h2].filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((en, obs) => en.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    }), { threshold: 0.12 });
    targets.forEach(el => io.observe(el));
  } else targets.forEach(el => el.classList.add('is-in'));
  if (reduced) return;
  const lerp = (a, b, t) => a + (b - a) * t;
  let raf = 0;
  const upd = () => {
    raf = 0;
    const r = sec.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    const sc = p < .5 ? lerp(1.25, 1.04, p / .5) : lerp(1.04, 1.12, (p - .5) / .5);
    sec.style.setProperty('--kb-is', sc.toFixed(4));
    sec.style.setProperty('--kb-iy', lerp(-4, 4, p).toFixed(2) + '%');
    sec.style.setProperty('--kb-sy', lerp(120, -120, p).toFixed(1) + 'px');
    sec.style.setProperty('--kb-sr', (p < .5 ? lerp(9, -1, p / .5) : lerp(-1, -5, (p - .5) / .5)).toFixed(2) + 'deg');
    sec.style.setProperty('--kb-rot', lerp(-60, 180, p).toFixed(1) + 'deg');
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  window.addEventListener('resize', upd, { passive: true });
  upd();
})();

/* 9. Dúvidas e chamada final: entradas, blur-in e parallax */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.kb-blur:not([data-split])').forEach(h => {
    h.dataset.split = '1';
    const t = h.textContent.trim();
    h.setAttribute('aria-label', t);
    h.innerHTML = t.split(/\s+/).map((w, i) => `<span class="bw" aria-hidden="true" style="--i:${i}">${w}</span>`).join(' ');
  });
  document.querySelectorAll('.kb-faq .faq-item').forEach((el, i) => el.style.setProperty('--d', i));
  const els = document.querySelectorAll('.kb-faq .faq-item, .kb-cta, .kb-cta .kb-blur');
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('kb-js');
    const io = new IntersectionObserver((en, obs) => en.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
    }), { threshold: 0.15 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('is-in'));
  const cta = document.querySelector('.kb-cta');
  if (!cta || reduced) return;
  let raf = 0;
  const upd = () => {
    raf = 0;
    const r = cta.getBoundingClientRect(), vh = window.innerHeight;
    if (r.bottom < 0 || r.top > vh) return;
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    cta.style.setProperty('--kb-cy', (8 - 16 * p).toFixed(2) + '%');
    cta.style.setProperty('--kb-my', (120 - 240 * p).toFixed(1) + 'px');
    cta.style.setProperty('--kb-mr', (-14 + 28 * p).toFixed(1) + 'deg');
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
  upd();
})();
