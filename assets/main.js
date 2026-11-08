/* Dra. Kelly Barbi — Motion, Scroll Reveal & Lazy Map (Progressive Enhancement) */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('.topbar');

  // Inicializa animações de entrada fora da 1ª dobra no primeiro scroll (TBT = 0 ms no load)
  let revealInitialized = false;
  const initScrollReveal = () => {
    if (revealInitialized || reducedMotion || !('IntersectionObserver' in window)) return;
    revealInitialized = true;
    const imageTargets = [
      ...document.querySelectorAll('.benefit-photo, .care-image, .about-image, .contact-visual img')
    ];
    const revealTargets = [
      ...document.querySelectorAll(
        '.service-item, .benefit-copy > *, .care-copy > *, .care-image-wrap, .service-card, .review, .about-grid > div, .region-box, .faq-item, .wait-panel > *, .contact-grid > *'
      )
    ];

    revealTargets.forEach((el, idx) => {
      el.classList.add('motion-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(idx % 4, 3) * 60}ms`);
    });

    const imageMap = new Map();
    imageTargets.forEach(img => {
      img.classList.add('image-reveal');
      const trigger = img.closest('section, .care-image-wrap, .contact-visual') || img.parentElement;
      if (!imageMap.has(trigger)) imageMap.set(trigger, []);
      imageMap.get(trigger).push(img);
    });

    document.body.classList.add('motion-ready', 'has-scrolled');

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          imageMap.get(entry.target)?.forEach(img => img.classList.add('is-visible'));
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -16px 0px' }
    );
    new Set([...revealTargets, ...imageMap.keys()]).forEach(el => observer.observe(el));
  };

  // Hidratação lazy do iframe do Google Maps na seção #contato
  const mapFrame = document.querySelector('iframe[data-map-src]');
  if (mapFrame && 'IntersectionObserver' in window) {
    const mapObs = new IntersectionObserver(
      (entries, obs) => {
        if (entries[0]?.isIntersecting) {
          mapFrame.src = mapFrame.getAttribute('data-map-src');
          mapFrame.removeAttribute('data-map-src');
          obs.disconnect();
        }
      },
      { rootMargin: '350px 0px' }
    );
    mapObs.observe(mapFrame);
  }

  // Header glassmorphism e parallax sutil nas imagens secundárias (leitura/escrita separadas)
  let framePending = false;
  const parallaxItems = reducedMotion
    ? []
    : [...document.querySelectorAll('.benefit-photo, .care-image')];

  const onScrollFrame = () => {
    framePending = false;
    initScrollReveal();
    const y = window.scrollY || 0;
    const winH = window.innerHeight || 800;

    const offsets = parallaxItems.map((el, idx) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < winH) {
        const raw = (rect.top + rect.height / 2 - winH / 2) * (idx === 0 ? -0.015 : -0.012);
        return Math.max(-10, Math.min(10, raw)).toFixed(1);
      }
      return null;
    });

    if (header) header.classList.toggle('is-scrolled', y > 12);
    offsets.forEach((val, idx) => {
      if (val !== null) parallaxItems[idx].style.setProperty('--parallax-y', `${val}px`);
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!framePending) {
        framePending = true;
        window.requestAnimationFrame(onScrollFrame);
      }
    },
    { passive: true }
  );

  // Efeito magnético leve nos CTAs apenas para ponteiro fino
  if (!reducedMotion && finePointer) {
    document.querySelectorAll('.button-primary, .wait-action .button, .whatsapp-float').forEach(btn => {
      btn.classList.add('magnetic');
      let rect = null;
      btn.addEventListener('pointerenter', () => {
        rect = btn.getBoundingClientRect();
      }, { passive: true });
      btn.addEventListener('pointermove', ev => {
        if (!rect) rect = btn.getBoundingClientRect();
        btn.style.setProperty('--mag-x', `${(((ev.clientX - rect.left) / rect.width - 0.5) * 5).toFixed(1)}px`);
        btn.style.setProperty('--mag-y', `${(((ev.clientY - rect.top) / rect.height - 0.5) * 4).toFixed(1)}px`);
      }, { passive: true });
      btn.addEventListener('pointerleave', () => {
        rect = null;
        btn.style.setProperty('--mag-x', '0px');
        btn.style.setProperty('--mag-y', '0px');
      }, { passive: true });
    });
  }

  /* Eventos de conversão GA4 / Meta Pixel comentados (ativar após confirmação e LGPD)
  document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
    a.addEventListener('click', () => {
      const ctx = a.getAttribute('data-cta-context') || 'whatsapp';
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { event_label: ctx });
      if (typeof window.fbq === 'function') window.fbq('track', 'Contact', { content_name: ctx });
    });
  });
  */
})();
