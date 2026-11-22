
/**
 * CARROSSEL CIRCULAR EM LEQUE DE 5 CARDS: portado do site Dra. Gabriela Faria para o site Thays Traboulsi (seção Serviços)
 * Mecânica idêntica à referência: arco circular com seno/cosseno, passo, raio R,
 * interpolação suave via requestAnimationFrame, arrasto de alta precisão e rotação em leque.
 * Cores nobres e acolhedoras adaptadas à paleta da Dra. Gabriela.
 */

function initCasosCarousel(section) {
  if (!section) return () => {};
  const ac = new AbortController();
  const sig = { signal: ac.signal };

  const carrossel = section.querySelector('[data-casos-carrossel]');
  const palco = section.querySelector('[data-casos-palco]');
  const deck = section.querySelector('#casos-deck');
  const statusEl = section.querySelector('[data-casos-status]');
  const contadorAtual = section.querySelector('.casos-contador-atual');
  const prevBtn = section.querySelector('.casos-seta[data-dir="prev"]');
  const nextBtn = section.querySelector('.casos-seta[data-dir="next"]');
  const cards = Array.from(section.querySelectorAll('.casos-card'));
  const total = cards.length;

  if (!palco || !deck || total < 3) return () => {};

  const Hc = Math.PI / 180;
  const Uc = 50;
  const Wc = 4.5;
  const Gc = 40;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mediaMobile = window.matchMedia('(max-width: 720px)');

  let baseGiro = [0, 3.5, -2.5, 2, -4];
  let cardItems = cards.map((el, i) => ({
    el,
    i,
    inner: el.querySelector('.casos-card-in'),
    veu: el.querySelector('.casos-card-veu'),
    topo: el.querySelector('.casos-card-topo'),
    link: el.querySelector('.casos-ir'),
    titulo: el.querySelector('h3')?.textContent.trim() || '',
    abre: 1,
    hover: 0,
    giro: baseGiro[i % baseGiro.length]
  }));

  let estado = { pos: 0, arrasto: 0 };
  let targetPos = 0;
  let activeIndex = 0;

  const mod = (e, t) => ((e % t) + t) % t;
  const dist = (e, t) => mod(e - t + total / 2, total) - total / 2;

  function getGeometry() {
    let cw = cards[0].offsetWidth || 300;
    let isMob = mediaMobile.matches;
    let passo = isMob ? 9 : 11;
    let vao = isMob ? 0.8 : 0.88;
    return {
      cw,
      passo,
      vao,
      rotulo: isMob ? { ate: 1, faixa: 0.55 } : { ate: 1.8, faixa: 0.8 },
      R: (vao * cw) / Math.sin(passo * Hc),
      lift: -0.07 * cw
    };
  }

  let geom = getGeometry();
  let rafId = 0;

  function scheduleRender() {
    if (!rafId) {
      rafId = requestAnimationFrame(render);
    }
  }

  function render() {
    rafId = 0;
    let { passo, R, lift, rotulo } = geom;
    let currentVirtualPos = estado.pos + estado.arrasto;

    for (let card of cardItems) {
      let delta = dist(card.i, currentVirtualPos);
      let absDelta = Math.abs(delta);
      let scaledDelta = delta * card.abre;
      let absScaled = Math.abs(scaledDelta);
      let angle = passo * scaledDelta;

      let tx = R * Math.sin(angle * Hc);
      let ty = R * (1 - Math.cos(angle * Hc)) + lift * Math.max(0, 1 - absScaled) - card.hover * 12;
      let scale = 1 - 0.065 * Math.min(absScaled, 2.5);
      let rot = angle + card.giro * (1 - card.abre);
      let opacity = absDelta <= 2 ? 1 : Math.max(0, 1 - (absDelta - 2) / 0.45);

      if (prefersReduced) {
        let isC = Math.round(absDelta) === 0;
        card.el.style.transform = isC ? 'none' : 'scale(0.85)';
        card.el.style.opacity = isC ? '1' : '0';
        card.el.style.visibility = isC ? 'visible' : 'hidden';
        card.el.style.zIndex = isC ? '10' : '1';
        continue;
      }

      card.el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      card.el.style.opacity = opacity.toFixed(3);
      card.el.style.zIndex = String(100 - Math.round(absDelta * 10));
      card.el.style.visibility = opacity < 0.01 ? 'hidden' : '';

      if (card.veu) {
        card.veu.style.opacity = (Math.min(absScaled, 2) * 0.16 * (1 - card.hover * 0.6)).toFixed(3);
      }
      if (card.topo) {
        card.topo.style.opacity = Math.min(1, Math.max(0, (rotulo.ate - absScaled) / rotulo.faixa)).toFixed(3);
      }
    }
  }

  function updateActiveState(direction = 0, announce = true) {
    activeIndex = mod(targetPos, total);

    for (let card of cardItems) {
      let roundedRel = Math.round(dist(card.i, targetPos));
      let isCenter = roundedRel === 0;
      let isNear = Math.abs(roundedRel) <= 1;

      card.el.dataset.pos = String(roundedRel);
      card.el.classList.toggle('is-centro', isCenter);

      if (isNear) {
        card.el.removeAttribute('aria-hidden');
      } else {
        card.el.setAttribute('aria-hidden', 'true');
      }

      if (card.link) {
        if (isCenter) {
          card.link.removeAttribute('tabindex');
        } else {
          card.link.setAttribute('tabindex', '-1');
        }
      }
    }

    if (contadorAtual) {
      const numStr = String(activeIndex + 1).padStart(2, '0');
      contadorAtual.innerHTML = `<span>${numStr}</span>`;
    }

    if (announce && statusEl && cardItems[activeIndex]) {
      statusEl.textContent = `${activeIndex + 1} de ${total}: ${cardItems[activeIndex].titulo}`;
    }
  }

  let animStartTime = 0;
  let animStartPos = 0;
  let animTargetPos = 0;
  let animDuration = 600;
  let animRaf = 0;

  function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  }

  function animateTo(target, duration = 420) {
    if (prefersReduced) {
      estado.pos = target;
      render();
      return;
    }
    cancelAnimationFrame(animRaf);
    palco.classList.add('is-animando');
    animStartTime = performance.now();
    animStartPos = estado.pos;
    animTargetPos = target;
    animDuration = duration;

    function step(now) {
      let elapsed = now - animStartTime;
      let progress = Math.min(1, elapsed / animDuration);
      let eased = easeOutExpo(progress);
      estado.pos = animStartPos + (animTargetPos - animStartPos) * eased;
      scheduleRender();
      if (progress < 1) {
        animRaf = requestAnimationFrame(step);
      } else {
        estado.pos = animTargetPos;
        scheduleRender();
        palco.classList.remove('is-animando');
      }
    }
    animRaf = requestAnimationFrame(step);
  }

  function goTo(newTarget, { focusCenter = false, announce = true } = {}) {
    let diff = newTarget - targetPos;
    let dir = Math.sign(diff);
    targetPos = newTarget;
    updateActiveState(dir, announce);
    animateTo(targetPos);
    if (focusCenter) {
      cardItems[activeIndex]?.link?.focus({ preventScroll: true });
    }
  }

  function advance(step) {
    goTo(targetPos + step);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => advance(-1), sig);
  if (nextBtn) nextBtn.addEventListener('click', () => advance(1), sig);

  carrossel.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    advance(e.key === 'ArrowRight' ? 1 : -1);
  }, sig);

  for (let card of cardItems) {
    card.el.addEventListener('click', (e) => {
      let roundedRel = Math.round(dist(card.i, targetPos));
      if (roundedRel !== 0) {
        if (e.detail === 0 && e.target.closest('.casos-ir')) return;
        e.preventDefault();
        e.stopPropagation();
        advance(roundedRel);
      }
    }, sig);

    card.el.addEventListener('pointerenter', (e) => {
      if (e.pointerType !== 'mouse' || pointerState?.active || card.el.classList.contains('is-centro')) return;
      card.hover = 1;
      scheduleRender();
    }, sig);

    card.el.addEventListener('pointerleave', () => {
      if (card.hover) {
        card.hover = 0;
        scheduleRender();
      }
    }, sig);
  }

  let pointerState = null;
  let didDrag = false;

  const dragDampen = (dx) => {
    let t = dx / (geom.vao * geom.cw);
    return 0.9 * Math.tanh((t * 0.8) / 0.9);
  };

  palco.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerState = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      dx: 0,
      active: false
    };
  }, sig);

  palco.addEventListener('pointermove', (e) => {
    if (!pointerState || e.pointerId !== pointerState.id) return;
    let dx = e.clientX - pointerState.x0;
    let dy = e.clientY - pointerState.y0;

    if (!pointerState.active) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        pointerState = null;
        return;
      }
      pointerState.active = true;
      try {
        palco.setPointerCapture(e.pointerId);
      } catch {}
      palco.classList.add('is-arrastando');
      cancelAnimationFrame(animRaf);
    }

    pointerState.dx = dx;
    if (!prefersReduced) {
      estado.arrasto = -dragDampen(dx);
      scheduleRender();
    }
  }, sig);

  function endDrag(e, cancel = false) {
    if (!pointerState || e.pointerId !== pointerState.id) return;
    let { active, dx, t0 } = pointerState;
    pointerState = null;
    palco.classList.remove('is-arrastando');
    if (!active) return;

    didDrag = true;
    setTimeout(() => {
      didDrag = false;
    }, 50);

    estado.pos += estado.arrasto;
    estado.arrasto = 0;

    let quickFlick = Math.abs(dx) > 24 && performance.now() - t0 < 260;
    if (!cancel && (Math.abs(dx) > Uc || quickFlick)) {
      goTo(Math.round(estado.pos) + (dx < 0 ? 1 : -1));
    } else {
      animateTo(Math.round(estado.pos), 320);
    }
  }

  palco.addEventListener('pointerup', (e) => endDrag(e), sig);
  palco.addEventListener('pointercancel', (e) => endDrag(e, true), sig);
  palco.addEventListener('click', (e) => {
    if (didDrag) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true, signal: ac.signal });

  palco.addEventListener('dragstart', (e) => e.preventDefault(), sig);

  window.addEventListener('resize', () => {
    geom = getGeometry();
    scheduleRender();
  }, { passive: true, signal: ac.signal });

  updateActiveState(0, false);
  scheduleRender();

  return () => {
    ac.abort();
    cancelAnimationFrame(rafId);
    cancelAnimationFrame(animRaf);
  };
}

initCasosCarousel(document.querySelector('.casos-secao'));
