/* ==========================================================================
   Dra. Kelly Barbi — Movimento Moderno: Scroll Reveal, Parallax Multi-Camada,
   Barra de Progresso no Scroll, Spotlight Hover & Botões Magnéticos (60fps)
   ========================================================================== */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const header = document.querySelector('.topbar');
  const progressBar = document.querySelector('.scroll-progress');

  // 1. Scroll Reveal Progressivo (Staggered Text, Listas, Cards, Pílulas e Imagens)
  const setupReveal = () => {
    if (reducedMotion || !('IntersectionObserver' in window)) return;

    const groups = [
      '.service-strip .service-item',
      '#cuidado .benefit-copy > .eyebrow, #cuidado .benefit-copy > h2, #cuidado .benefit-copy > p, #cuidado .benefit-copy > .button',
      '#cuidado .benefit-list li',
      '#atendimento .care-copy > .eyebrow, #atendimento .care-copy > h2, #atendimento .care-copy > p, #atendimento .care-copy > .button',
      '#atendimento .care-pills .pill',
      '#atendimento .service-card',
      '#depoimentos .section-head > *, #depoimentos .google-proof',
      '#depoimentos .review',
      '#sobre .about-grid > div > *',
      '#sobre .region-box',
      '#perguntas-frequentes .section-head > *',
      '#perguntas-frequentes .faq-item',
      '#lista-de-espera .wait-panel > *',
      '#contato .section-head > *',
      '#contato .contact-row, #contato .contact-actions',
      '#contato .map-embed'
    ];

    const revealElements = [];
    groups.forEach(selector => {
      document.querySelectorAll(selector).forEach((el, idx) => {
        el.classList.add('motion-reveal');
        el.style.setProperty('--reveal-delay', `${Math.min(idx, 5) * 75}ms`);
        revealElements.push(el);
      });
    });

    const imageTargets = [
      ...document.querySelectorAll('.benefit-photo, .care-image, .about-image, .contact-visual img')
    ];
    imageTargets.forEach(img => img.classList.add('image-reveal'));

    document.body.classList.add('motion-ready');

    const textObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    );
    revealElements.forEach(el => textObserver.observe(el));

    const imageObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -40px 0px' }
    );
    imageTargets.forEach(img => imageObserver.observe(img));
  };

  // Inicializa o reveal logo após o primeiro paint (não bloqueia LCP nem TBT)
  if (document.readyState === 'complete') {
    window.requestAnimationFrame(setupReveal);
  } else {
    window.addEventListener('load', () => window.requestAnimationFrame(setupReveal), { once: true });
  }

  // 2. Hidratação Lazy do Mapa na seção #contato
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

  // 3. Navegação Ativa por Seção (Scroll Spy leve via IntersectionObserver)
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]:not(.button)')];
  if (navLinks.length && 'IntersectionObserver' in window) {
    const linkMap = new Map();
    navLinks.forEach(link => {
      const id = link.getAttribute('href').slice(1);
      const sec = document.getElementById(id);
      if (sec) linkMap.set(sec, link);
    });
    const spyObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            navLinks.forEach(l => l.classList.remove('is-active'));
            linkMap.get(entry.target)?.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-35% 0px -55% 0px' }
    );
    linkMap.forEach((_, sec) => spyObserver.observe(sec));
  }

  // 4. Parallax Multi-Camada + Barra de Progresso no Scroll (Leitura/Escrita separadas)
  const parallaxLayers = reducedMotion
    ? []
    : [
        { el: document.querySelector('.hero-photo'), speed: 0.045, max: 24 },
        { el: document.querySelector('.photo-note'), speed: -0.065, max: 26 },
        { el: document.querySelector('.star-doodle'), speed: -0.08, max: 30, rotate: true },
        { el: document.querySelector('.dots'), speed: 0.05, max: 20 },
        { el: document.querySelector('.benefit-photo'), speed: -0.045, max: 24 },
        { el: document.querySelector('.care-image'), speed: -0.045, max: 24 },
        { el: document.querySelector('.care-tag'), speed: 0.06, max: 20 },
        { el: document.querySelector('.about-image'), speed: -0.04, max: 22 },
        { el: document.querySelector('.contact-visual img'), speed: -0.035, max: 18 }
      ].filter(item => item.el);

  let framePending = false;
  const onScrollFrame = () => {
    framePending = false;
    const y = window.scrollY || 0;
    const winH = window.innerHeight || 800;
    const docH = Math.max(document.documentElement.scrollHeight - winH, 1);
    const progress = Math.min(1, Math.max(0, y / docH));

    // Fase 1: Leituras geométricas (DOM reads)
    const computed = parallaxLayers.map(item => {
      const rect = item.el.getBoundingClientRect();
      if (rect.bottom > -60 && rect.top < winH + 60) {
        const centerOffset = rect.top + rect.height / 2 - winH / 2;
        const shift = Math.max(-item.max, Math.min(item.max, centerOffset * item.speed));
        return { item, shift: shift.toFixed(1) };
      }
      return null;
    });

    // Fase 2: Escritas de estilo na GPU (DOM writes)
    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (progressBar) progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));

    computed.forEach(entry => {
      if (!entry) return;
      entry.item.el.style.setProperty('--parallax-y', `${entry.shift}px`);
      if (entry.item.rotate) {
        entry.item.el.style.setProperty('--parallax-rot', `${(Number(entry.shift) * 0.45).toFixed(1)}deg`);
      }
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

  // 5. Hover Moderno: Spotlight Glow nos Cards + Botões Magnéticos (Ponteiro Fino)
  if (!reducedMotion && finePointer) {
    // Spotlight interativo que segue o cursor nos cards
    document
      .querySelectorAll('.service-card, .review, .about-card, .region-box, .contact-row')
      .forEach(card => {
        card.classList.add('has-spotlight');
        let rect = null;
        card.addEventListener('pointerenter', () => {
          rect = card.getBoundingClientRect();
        }, { passive: true });
        card.addEventListener('pointermove', ev => {
          if (!rect) rect = card.getBoundingClientRect();
          card.style.setProperty('--spot-x', `${(ev.clientX - rect.left).toFixed(0)}px`);
          card.style.setProperty('--spot-y', `${(ev.clientY - rect.top).toFixed(0)}px`);
        }, { passive: true });
        card.addEventListener('pointerleave', () => {
          rect = null;
        }, { passive: true });
      });

    // Efeito magnético nos botões e CTAs
    document
      .querySelectorAll('.button, .whatsapp-float')
      .forEach(btn => {
        btn.classList.add('magnetic');
        let rect = null;
        btn.addEventListener('pointerenter', () => {
          rect = btn.getBoundingClientRect();
        }, { passive: true });
        btn.addEventListener('pointermove', ev => {
          if (!rect) rect = btn.getBoundingClientRect();
          const mx = ((ev.clientX - rect.left) / rect.width - 0.5) * 7;
          const my = ((ev.clientY - rect.top) / rect.height - 0.5) * 5;
          btn.style.setProperty('--mag-x', `${mx.toFixed(1)}px`);
          btn.style.setProperty('--mag-y', `${my.toFixed(1)}px`);
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
