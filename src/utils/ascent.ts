import { animate, inView } from 'motion';

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

const initializeRoute = (page: HTMLElement, reducedMotion: boolean) => {
  const route = page.querySelector<HTMLElement>('[data-route]');
  const line = route?.querySelector<SVGPathElement>('[data-route-line]');
  const map = route?.querySelector<SVGSVGElement>('.ascent-route__map');
  if (!route || !line || !map) return;

  const stops = Array.from(route.querySelectorAll<HTMLElement>('[data-route-stop]'));
  const viewBoxHeight = map.viewBox.baseVal.height;
  const markerDistances = new Map<HTMLElement, number>();
  const markerPositions = new Map<HTMLElement, DOMPoint>();
  const pathLayers = Array.from(
    route.querySelectorAll<SVGPathElement>(
      '[data-route-line], .ascent-route__shadow, [data-route-pulse-trail], [data-route-pulse]',
    ),
  );
  const pulseTrail = route.querySelector<SVGPathElement>('[data-route-pulse-trail]');
  const pulse = route.querySelector<SVGPathElement>('[data-route-pulse]');
  let routeTop = 0;
  let routeHeight = 0;
  let pathLength = 0;
  let firstStopY = 0;
  let finalStopY = viewBoxHeight;
  let frame = 0;

  if (viewBoxHeight <= 0 || stops.length === 0) return;

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

  const markerPosition = (stopElement: HTMLElement) => {
    const marker = stopElement.querySelector<HTMLElement>('.ascent-stop__marker');
    const matrix = map.getScreenCTM();
    if (!marker || !matrix) return undefined;

    const bounds = marker.getBoundingClientRect();
    const point = map.createSVGPoint();
    point.x = bounds.left + bounds.width / 2;
    point.y = bounds.top + bounds.height / 2;
    return point.matrixTransform(matrix.inverse());
  };

  const measure = () => {
    const bounds = route.getBoundingClientRect();
    routeTop = bounds.top + window.scrollY;
    routeHeight = bounds.height;
    markerDistances.clear();
    markerPositions.clear();

    stops.forEach((stopElement) => {
      const position = markerPosition(stopElement);
      if (position) markerPositions.set(stopElement, position);
    });

    const points = stops
      .map((stopElement) => markerPositions.get(stopElement))
      .filter((point): point is DOMPoint => point !== undefined);
    if (points.length !== stops.length) return;

    const firstPoint = points[0];
    const lastPoint = points.at(-1);
    if (!firstPoint || !lastPoint) return;

    let pathData = `M ${firstPoint.x} ${firstPoint.y}`;
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const point = points[index];
      if (!previous || !point) continue;

      const distance = point.y - previous.y;
      pathData += ` C ${previous.x} ${previous.y + distance * 0.45} ${point.x} ${point.y - distance * 0.45} ${point.x} ${point.y}`;
    }
    pathLayers.forEach((path) => path.setAttribute('d', pathData));

    pathLength = line.getTotalLength();
    if (pathLength <= 0) return;

    firstStopY = firstPoint.y;
    finalStopY = lastPoint.y;
    stops.forEach((stopElement) => {
      const position = markerPositions.get(stopElement);
      if (position) markerDistances.set(stopElement, pathLengthAtY(position.y));
    });
    update();
  };

  const update = () => {
    frame = 0;
    if (routeHeight <= 0) return;

    const scrollAnchor = window.innerHeight * 0.5;
    const localY = Math.max(
      0,
      Math.min(
        viewBoxHeight,
        ((window.scrollY + scrollAnchor - routeTop) / routeHeight) * viewBoxHeight,
      ),
    );
    const startDistance = pathLengthAtY(firstStopY);
    const finalDistance = pathLengthAtY(finalStopY);
    const journeyLength = finalDistance - startDistance;
    if (!Number.isFinite(journeyLength) || journeyLength <= 0) return;
    const progress =
      localY <= firstStopY
        ? 0
        : localY >= finalStopY
          ? 1
          : (pathLengthAtY(localY) - startDistance) / journeyLength;
    const normalizedProgress = Math.max(0, Math.min(1, progress));

    line.style.strokeDashoffset = String(1 - normalizedProgress);
    stops.forEach((stopElement, index) => {
      const stopDistance = markerDistances.get(stopElement);
      const threshold =
        stopDistance === undefined
          ? 1
          : Math.min(1, Math.max(0, (stopDistance - startDistance) / journeyLength));
      stopElement.classList.toggle('is-reached', normalizedProgress >= threshold);
      const currentPosition = markerPositions.get(stopElement)?.y;
      const nextStop = stops[index + 1];
      const nextPosition = nextStop ? markerPositions.get(nextStop)?.y : undefined;
      const isCurrent =
        currentPosition !== undefined &&
        (index === 0 || localY >= currentPosition) &&
        (nextPosition === undefined || localY < nextPosition);
      stopElement.classList.toggle('is-current', isCurrent);
    });
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  const journey = route.closest<HTMLElement>('.ascent-journey');
  let pulseObserver: IntersectionObserver | undefined;
  let snapObserver: IntersectionObserver | undefined;
  if (!reducedMotion) {
    pulseObserver = new IntersectionObserver(
      ([entry]) => route.classList.toggle('is-pulse-active', entry.isIntersecting),
      { rootMargin: '20% 0px', threshold: 0 },
    );
    pulseObserver.observe(route);

    snapObserver = new IntersectionObserver(
      ([entry]) =>
        document.documentElement.classList.toggle('ascent-is-on-journey', entry.isIntersecting),
      { threshold: 0 },
    );
    if (journey) snapObserver.observe(journey);
  }

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
    pulseObserver?.disconnect();
    snapObserver?.disconnect();
    document.documentElement.classList.remove('ascent-is-on-journey');
    pulseTrail?.style.removeProperty('stroke-dashoffset');
    pulse?.style.removeProperty('stroke-dashoffset');
    route.classList.remove('is-pulse-active');
  });
};

const initializeScrollEffects = (page: HTMLElement) => {
  const altitude = page.querySelector<HTMLElement>('[data-altitude-value]');
  const currentLabel = page.querySelector<HTMLElement>('[data-current-section]');
  const sections = Array.from(page.querySelectorAll<HTMLElement>('[data-ascent-section]'));
  const ticks = Array.from(page.querySelectorAll<HTMLElement>('[data-meter-stop]'));
  let landmarks: Array<{ top: number; altitude: number; label: string; id: string }> = [];
  let frame = 0;

  const measureLandmarks = () => {
    landmarks = sections
      .map((section) => {
        const bounds = section.getBoundingClientRect();
        return {
          top:
            bounds.top +
            window.scrollY +
            Math.max(0, Math.min(window.innerHeight / 2, bounds.height - window.innerHeight / 2)),
          altitude: Number(section.dataset.sectionAltitude),
          label: section.dataset.sectionLabel ?? '',
          id: section.id,
        };
      })
      .filter((landmark) => Number.isFinite(landmark.altitude))
      .sort((first, second) => first.top - second.top);
    updateScrollEffects();
  };

  const updateScrollEffects = () => {
    frame = 0;
    if (landmarks.length === 0) return;

    const scrollPosition = window.scrollY + window.innerHeight / 2;
    let segmentIndex = 0;
    while (
      segmentIndex < landmarks.length - 1 &&
      scrollPosition >= landmarks[segmentIndex + 1].top
    ) {
      segmentIndex += 1;
    }

    const current = landmarks[segmentIndex];
    const next = landmarks[segmentIndex + 1];
    const sectionProgress = next
      ? Math.max(
          0,
          Math.min(1, (scrollPosition - current.top) / Math.max(1, next.top - current.top)),
        )
      : 0;
    const currentAltitude =
      current.altitude + (next ? (next.altitude - current.altitude) * sectionProgress : 0);
    const normalized = Math.max(0, Math.min(1, currentAltitude / 2519));

    if (altitude) altitude.textContent = Math.round(currentAltitude).toLocaleString('en-US');
    page.style.setProperty('--meter-progress', String(normalized));
    page.style.setProperty('--page-progress', String(normalized));
    if (currentLabel) currentLabel.textContent = current.label;
    ticks.forEach((tick) => {
      if (tick.dataset.meterStop === current.id) tick.setAttribute('aria-current', 'location');
      else tick.removeAttribute('aria-current');
    });
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(updateScrollEffects);
  };

  const resizeObserver = new ResizeObserver(measureLandmarks);
  sections.forEach((section) => resizeObserver.observe(section));
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', measureLandmarks, { passive: true });
  addCleanup(() => {
    window.cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', measureLandmarks);
  });
  measureLandmarks();

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

  const observedSections = page.querySelectorAll<HTMLElement>('[data-ascent-section]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        setClimate(section);
      });
    },
    { rootMargin: '-44% 0px -44% 0px', threshold: 0 },
  );
  observedSections.forEach((section) => sectionObserver.observe(section));
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
  initializeRoute(page, reducedMotion);

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
