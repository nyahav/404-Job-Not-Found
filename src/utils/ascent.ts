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
  if (!route || !line) return;

  const stops = Array.from(route.querySelectorAll<HTMLElement>('[data-route-progress]'));
  addCleanup(
    scroll(
      (progress) => {
        const routeProgress = Math.max(0, Math.min(1, progress));
        line.style.strokeDashoffset = String(1 - routeProgress);
        stops.forEach((stopElement) => {
          const threshold = Number(stopElement.dataset.routeProgress);
          stopElement.classList.toggle('is-reached', routeProgress >= threshold);
        });
      },
      { target: route, offset: ['start end', 'end start'] },
    ),
  );
};

const initializeCounts = (page: HTMLElement, enabled: boolean) => {
  if (!enabled) return;

  page.querySelectorAll<HTMLElement>('[data-count-to]').forEach((counter) => {
    const target = Number(counter.dataset.countTo);
    if (!Number.isFinite(target)) return;
    observeOnce(
      counter.closest('.ascent-stat') ?? counter,
      () => {
        counter.textContent = '0';
        const controls = animate(0, target, {
          duration: 1.4,
          ease: [0.2, 0.7, 0.2, 1],
          onUpdate: (current) => {
            counter.textContent = String(Math.round(current));
          },
        });
        addCleanup(() => controls.stop());
      },
      0.5,
    );
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

  const cursor = page.querySelector<HTMLElement>('[data-custom-cursor]');
  const canUseCursor = Boolean(cursor && window.matchMedia('(min-width: 64rem)').matches);
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

    if (canUseCursor && cursor) {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      cursor.classList.add('is-visible');
      cursor.classList.toggle(
        'is-hovering',
        Boolean((event.target as Element).closest('a, button')),
      );
    }
  };

  const resetPointer = () => {
    page.querySelectorAll<HTMLElement>('[data-tilt]').forEach((card) => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
    cursor?.classList.remove('is-visible', 'is-hovering');
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

  if (reducedMotion) {
    page.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
      element.classList.add('is-visible');
    });
    initializeScrollEffects(page);
    return;
  }

  initializeReveals(page);
  initializeRoute(page);
  initializeCounts(page, window.matchMedia('(min-width: 48rem)').matches);
  initializeScrollEffects(page);
  initializePointerEffects(page, reducedMotion);
  page.classList.add('is-enhanced');
};
