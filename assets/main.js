/* ==========================================================================
   Dra. Kelly Barbi — Movimento Moderno, Scroll Reveal & Interações (JS Mínimo)
   Progressive enhancement: sem JS, todo o conteúdo permanece 100% visível.
   ========================================================================== */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const supportsScrollTimeline =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('animation-timeline: view()');

  const header = document.querySelector('.topbar');

  // Nota de performance (Core Web Vitals / LCP):
  // A imagem do Hero (.hero-photo) NÃO entra em imageTargets para nunca atrasar o LCP.
  const imageTargets = [
    ...document.querySelectorAll('.benefit-photo, .care-image, .about-image, .contact-visual img')
  ];
  const revealTargets = [
    ...document.querySelectorAll(
      '.service-item, .benefit-copy > *, .care-copy > *, .care-image-wrap, .services-grid > *, .review, .about-grid > div, .region-box, .faq-item, .wait-panel > *, .contact-grid > *'
    )
  ];

  if (!reducedMotion && 'IntersectionObserver' in window) {
    // Escrita em lote (Batch DOM writes) para evitar Forced Synchronous Reflow
    revealTargets.forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 65}ms`);
    });

    const imageRevealByTrigger = new Map();
    imageTargets.forEach(image => {
      image.classList.add('image-reveal');
      const trigger = image.closest('section, .care-image-wrap, .contact-visual') || image.parentElement;
      if (!imageRevealByTrigger.has(trigger)) imageRevealByTrigger.set(trigger, []);
      imageRevealByTrigger.get(trigger).push(image);
    });

    // Ativa progressive enhancement apenas após configurar classes
    document.body.classList.add('motion-ready');
    if (supportsScrollTimeline) {
      document.body.classList.add('supports-scroll-timeline');
    }

    const observerTargets = [...new Set([...revealTargets, ...imageRevealByTrigger.keys()])];
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          imageRevealByTrigger.get(entry.target)?.forEach(img => img.classList.add('is-visible'));
          currentObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
    );
    observerTargets.forEach(element => observer.observe(element));
  }

  // Header sticky com glassmorphism e parallax sutil nas imagens secundárias
  // Separação estrita entre leitura de geometria e escrita de estilo para zero Forced Reflow.
  let framePending = false;
  const parallaxItems = reducedMotion
    ? []
    : [...document.querySelectorAll('.benefit-photo, .care-image')];

  const updateScrollState = () => {
    framePending = false;
    const y = window.scrollY || 0;
    const winH = window.innerHeight || 800;

    // 1. Fase de leitura (DOM reads)
    const offsets = parallaxItems.map((element, index) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < winH) {
        const factor = index === 0 ? -0.015 : -0.012;
        const raw = (rect.top + rect.height / 2 - winH / 2) * factor;
        return Math.max(-10, Math.min(10, raw)).toFixed(1);
      }
      return null;
    });

    // 2. Fase de escrita (DOM writes)
    if (y > 4) {
      document.body.classList.add('has-scrolled');
    }
    if (header) {
      header.classList.toggle('is-scrolled', y > 12);
    }
    offsets.forEach((val, index) => {
      if (val !== null) {
        parallaxItems[index].style.setProperty('--parallax-y', `${val}px`);
      }
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!framePending) {
        framePending = true;
        window.requestAnimationFrame(updateScrollState);
      }
    },
    { passive: true }
  );

  // Efeito magnético leve nos CTAs apenas em dispositivos com ponteiro fino
  if (!reducedMotion && finePointer) {
    document.querySelectorAll('.button-primary, .wait-action .button, .whatsapp-float').forEach(button => {
      button.classList.add('magnetic');
      let rectCache = null;
      button.addEventListener('pointerenter', () => {
        rectCache = button.getBoundingClientRect();
      }, { passive: true });
      button.addEventListener('pointermove', event => {
        if (!rectCache) rectCache = button.getBoundingClientRect();
        const x = ((event.clientX - rectCache.left) / rectCache.width - 0.5) * 5;
        const y = ((event.clientY - rectCache.top) / rectCache.height - 0.5) * 4;
        button.style.setProperty('--mag-x', `${x.toFixed(1)}px`);
        button.style.setProperty('--mag-y', `${y.toFixed(1)}px`);
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        rectCache = null;
        button.style.setProperty('--mag-x', '0px');
        button.style.setProperty('--mag-y', '0px');
      }, { passive: true });
    });
  }

  /* ==========================================================================
     Eventos de Conversão Preparados (GA4 / Meta Pixel) — COMENTADOS
     Ative apenas após configurar o ID real do Google Tag / Meta Pixel e
     confirmar o consentimento de cookies (LGPD).
     ========================================================================== */
  /*
  document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
    link.addEventListener('click', () => {
      const context = link.getAttribute('data-cta-context') || 'whatsapp_geral';
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'generate_lead', {
          event_category: 'WhatsApp',
          event_label: context,
          transport_type: 'beacon'
        });
      }
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Contact', { content_name: context });
      }
    });
  });
  */
})();
