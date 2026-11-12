import { animate, inView, scroll } from 'motion';

type Cleanup = () => void;

const activeCleanups: Cleanup[] = [];

const stop = () => {
  activeCleanups.splice(0).forEach((cleanup) => cleanup());
};

const addCleanup = (cleanup: Cleanup | undefined) => {
  if (cleanup) activeCleanups.push(cleanup);
};

const observeOnce = (element: Element, callback: (element: Element) => void, amount = 0.18) => {
  let hasEntered = false;
  const cleanup = inView(
    element,
    () => {
      if (hasEntered) return;
      hasEntered = true;
      callback(element);
    },
    { amount },
  );
  addCleanup(cleanup);
};

const initializeReveals = (page: HTMLElement) => {
  const photoReveal =
    document.documentElement.dir === 'rtl'
      ? ['inset(0 100% 0 0)', 'inset(0)']
      : ['inset(0 0 0 100%)', 'inset(0)'];

  page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element, index) => {
    observeOnce(element, () => {
      element.classList.add('is-visible');
      const controls = animate(
        element,
        { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
        {
          duration: 0.72,
          delay: Math.min(index % 5, 4) * 0.07,
          ease: [0.2, 0.7, 0.2, 1],
        },
      );
      addCleanup(() => controls.stop());
    });
  });

  page.querySelectorAll<HTMLElement>('[data-photo-reveal]').forEach((photo) => {
    observeOnce(photo, () => {
      const controls = animate(
        photo,
        { clipPath: photoReveal },
        {
          duration: 1.15,
          ease: [0.77, 0, 0.175, 1],
        },
      );
      addCleanup(() => controls.stop());
    });
  });

  page.querySelectorAll<SVGPathElement>('.topo-contour').forEach((path) => {
    observeOnce(path.closest('.topo-contours') ?? path, () => {
      const controls = animate(
        path,
        { strokeDashoffset: [1, 0] },
        {
          duration: 1.6,
          ease: [0.2, 0.7, 0.2, 1],
        },
      );
      addCleanup(() => controls.stop());
    });
  });
};

const initializeRoute = (page: HTMLElement) => {
  const route = page.querySelector<HTMLElement>('[data-route]');
  const line = route?.querySelector<SVGPathElement>('[data-route-line]');
  const map = route?.querySelector<SVGSVGElement>('.ascent-route__map');
  if (!route || !line || !map) return;

  const stops = Array.from(route.querySelectorAll<HTMLElement>('[data-route-stop]'));
  const pathLength = line.getTotalLength();
  const viewBoxHeight = map.viewBox.baseVal.height;
  const markerDistances = new Map<HTMLElement, number>();
  const pulseTrail = route.querySelector<SVGPathElement>('[data-route-pulse-trail]');
  const pulse = route.querySelector<SVGPathElement>('[data-route-pulse]');
  let routeTop = 0;
  let routeHeight = 0;
  let finalStopY = viewBoxHeight;
  let frame = 0;

  if (pathLength <= 0 || viewBoxHeight <= 0 || stops.length === 0) return;

  const pathLengthAtY = (targetY: number) => {
    let low = 0;
    let high = pathLength;

    for (let iteration = 0; iteration < 24; iteration += 1) {
      const middle = (low + high) / 2;
      if (line.getPointAtLength(middle).y < targetY) low = middle;
      else high = middle;
    }

    return (low + high) / 2;
  };

  const markerY = (stopElement: HTMLElement) => {
    const marker = stopElement.querySelector<HTMLElement>('.ascent-stop__marker');
    const matrix = map.getScreenCTM();
    if (!marker || !matrix) return undefined;

    const bounds = marker.getBoundingClientRect();
    const point = map.createSVGPoint();
    point.x = bounds.left + bounds.width / 2;
    point.y = bounds.top + bounds.height / 2;
    return point.matrixTransform(matrix.inverse()).y;
  };

  const measure = () => {
    const bounds = route.getBoundingClientRect();
    routeTop = bounds.top + window.scrollY;
    routeHeight = bounds.height;
    markerDistances.clear();

    stops.forEach((stopElement) => {
      const y = markerY(stopElement);
      if (y !== undefined) markerDistances.set(stopElement, pathLengthAtY(y));
    });

    const finalStop = stops.at(-1);
    const measuredFinalStopY = finalStop ? markerY(finalStop) : undefined;
    if (measuredFinalStopY !== undefined) finalStopY = measuredFinalStopY;
    update();
  };

  const update = () => {
    frame = 0;
    if (routeHeight <= 0) return;

    const scrollAnchor = window.innerHeight * 0.72;
    const localY = Math.max(
      0,
      Math.min(
        viewBoxHeight,
        ((window.scrollY + scrollAnchor - routeTop) / routeHeight) * viewBoxHeight,
      ),
    );
    const finalDistance = pathLengthAtY(finalStopY);
    if (!Number.isFinite(finalDistance) || finalDistance <= 0) return;
    const progress =
      localY <= 0 ? 0 : localY >= finalStopY ? 1 : pathLengthAtY(localY) / finalDistance;
    const normalizedProgress = Math.max(0, Math.min(1, progress));

    line.style.strokeDashoffset = String(1 - normalizedProgress);
    stops.forEach((stopElement) => {
      const stopDistance = markerDistances.get(stopElement);
      const threshold = stopDistance === undefined ? 1 : Math.min(1, stopDistance / finalDistance);
      stopElement.classList.toggle('is-reached', normalizedProgress >= threshold);
    });
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  const pulseObserver = new IntersectionObserver(
    ([entry]) => route.classList.toggle('is-pulse-active', entry.isIntersecting),
    { rootMargin: '20% 0px', threshold: 0 },
  );
  pulseObserver.observe(route);

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  const resizeObserver = new ResizeObserver(measure);
  resizeObserver.observe(route);
  measure();

  addCleanup(() => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', measure);
    resizeObserver?.disconnect();
    pulseObserver.disconnect();
    pulseTrail?.style.removeProperty('stroke-dashoffset');
    pulse?.style.removeProperty('stroke-dashoffset');
    route.classList.remove('is-pulse-active');
  });
};

const initializeScrollEffects = (page: HTMLElement) => {
  const altitude = page.querySelector<HTMLElement>('[data-altitude-value]');
  const updateScroll = scroll((progress) => {
    const normalized = Math.max(0, Math.min(1, progress));
    const rounded = Math.round(normalized * 2519);
    if (altitude) altitude.textContent = rounded.toLocaleString('en-US');
    page.style.setProperty('--meter-progress', String(normalized));
    page.style.setProperty('--page-progress', String(normalized));
  });
  addCleanup(updateScroll);

  const setClimate = (section: Element) => {
    const climate = section.getAttribute('data-climate');
    if (!climate) return;
    const skyTokens: Record<string, string> = {
      night: '--sky-pre-dawn',
      dawn: '--sky-dawn',
      sunrise: '--sky-sunrise',
      high: '--sky-high',
      dusk: '--sky-project',
      twilight: '--sky-twilight',
      summit: '--sky-summit',
    };
    const token = skyTokens[climate];
    if (token) page.style.setProperty('--active-sky', `var(${token})`);
  };

  const sections = page.querySelectorAll<HTMLElement>('[data-ascent-section]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        setClimate(section);
        const label = section.getAttribute('data-section-label');
        const currentLabel = page.querySelector<HTMLElement>('[data-current-section]');
        if (currentLabel && label) currentLabel.textContent = label;
        const currentTick = section.id;
        page.querySelectorAll<HTMLElement>('[data-meter-stop]').forEach((tick) => {
          if (tick.dataset.meterStop === currentTick) tick.setAttribute('aria-current', 'location');
          else tick.removeAttribute('aria-current');
        });
      });
    },
    { rootMargin: '-44% 0px -44% 0px', threshold: 0 },
  );
  sections.forEach((section) => sectionObserver.observe(section));
  addCleanup(() => sectionObserver.disconnect());
};

const initializePointerEffects = (page: HTMLElement, reducedMotion: boolean) => {
  if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const isRtl = document.documentElement.dir === 'rtl';

  const onPointerMove = (event: PointerEvent) => {
    page.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      if (x < 0 || x > 1 || y < 0 || y > 1) return;
      card.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
      card.style.setProperty('--tilt-y', `${(x - 0.5) * (isRtl ? -6 : 6)}deg`);
      card.style.setProperty('--spot-x', `${x * 100}%`);
      card.style.setProperty('--spot-y', `${y * 100}%`);
    });
  };

  const resetPointer = () => {
    page.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  };

  page.addEventListener('pointermove', onPointerMove, { passive: true });
  page.addEventListener('pointerleave', resetPointer);
  addCleanup(() => {
    page.removeEventListener('pointermove', onPointerMove);
    page.removeEventListener('pointerleave', resetPointer);
  });

  page
    .querySelectorAll<HTMLElement>('.ascent-magnetic, .ascent-hero__actions .ascent-button')
    .forEach((button) => {
      const onMove = (event: PointerEvent) => {
        const rect = button.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.12;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.12;
        button.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      };
      const onLeave = () => {
        button.style.transform = '';
      };
      button.addEventListener('pointermove', onMove, { passive: true });
      button.addEventListener('pointerleave', onLeave);
      addCleanup(() => {
        button.removeEventListener('pointermove', onMove);
        button.removeEventListener('pointerleave', onLeave);
      });
    });
};

export const resetAscent = () => stop();

export const initializeAscent = () => {
  stop();
  const page = document.querySelector<HTMLElement>('[data-ascent-page]');
  if (!page) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  page.dataset.motion = reducedMotion ? 'reduced' : 'full';
  page.classList.remove('is-enhanced');
  initializeRoute(page);

  if (reducedMotion) {
    page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      element.classList.add('is-visible');
    });
    initializeScrollEffects(page);
    return;
  }

  initializeReveals(page);
  initializeScrollEffects(page);
  initializePointerEffects(page, reducedMotion);
  page.classList.add('is-enhanced');
};
