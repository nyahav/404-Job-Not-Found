import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  animate,
  inView,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE } from './motion';

export default function SiteMotion() {
  const [isNavigating, setIsNavigating] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  const updateAboutScrollEffects = () => {
    const page = document.querySelector<HTMLElement>('.alpine-page');
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? scrollY.get() / scrollableHeight : 0;
    page?.style.setProperty('--about-progress', String(Math.min(1, Math.max(0, progress))));

    if (reduceMotion) return;

    const heroImage = document.querySelector<HTMLElement>('.about-hero__image');
    if (heroImage) {
      heroImage.style.setProperty('--hero-parallax', `${Math.min(scrollY.get() * 0.12, 72)}px`);
    }

    const horizon = document.querySelector<HTMLElement>('[data-mountain-horizon]');
    if (!horizon) return;

    const bounds = horizon.getBoundingClientRect();
    const position = (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height);
    const progressThroughView = Math.min(1, Math.max(0, position)) * 2 - 1;
    const range =
      Number.parseFloat(window.getComputedStyle(horizon).getPropertyValue('--parallax-range')) ||
      56;

    horizon.querySelectorAll<HTMLElement>('.ridge').forEach((ridge) => {
      const depth =
        Number.parseFloat(window.getComputedStyle(ridge).getPropertyValue('--depth')) || 0;
      ridge.style.transform = `translate3d(0, ${-progressThroughView * depth * range}px, 0)`;
    });
  };

  useMotionValueEvent(scrollY, 'change', updateAboutScrollEffects);

  useEffect(() => {
    document.documentElement.classList.add('js');
    let cleanups: Array<() => void> = [];

    const revealPage = () => {
      cleanups.forEach((cleanup) => cleanup());
      cleanups = [];

      if (reduceMotion) {
        document
          .querySelectorAll(
            '.reveal, .ridge, .mist, .about-hero__content, .about-hero__caption, .scroll-cue',
          )
          .forEach((element) => {
            element.classList.add('is-visible');
          });
        return;
      }

      document
        .querySelectorAll<HTMLElement>(
          '.reveal, .ridge, .mist, .about-hero__content, .about-hero__caption, .scroll-cue',
        )
        .forEach((element, index) => {
          const stop = inView(
            element,
            () => {
              element.classList.add('is-visible');
              const entranceMotion = element.matches('.ridge, .mist')
                ? { opacity: [0, 1] }
                : { opacity: [0, 1], y: [18, 0] };
              const entrance = animate(element, entranceMotion, {
                duration: MOTION_DURATION.slow,
                delay: Math.min(index * 0.035, 0.28),
                ease: MOTION_EASE,
              });
              const svg = element.matches('.ridge')
                ? element.querySelector<SVGElement>('.ridge__svg')
                : null;
              const drift = svg
                ? animate(
                    svg,
                    { x: [-12, 12] },
                    { duration: 28, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' },
                  )
                : null;
              return () => {
                entrance.stop();
                drift?.stop();
              };
            },
            { amount: element.matches('.ridge, .mist') ? 0.02 : 0.12 },
          );
          cleanups.push(stop);
        });
    };

    const onNavigationStart = () => setIsNavigating(!reduceMotion);
    const onPageLoad = () => {
      revealPage();
      updateAboutScrollEffects();
      setIsNavigating(false);
    };

    revealPage();
    updateAboutScrollEffects();
    document.addEventListener('astro:before-preparation', onNavigationStart);
    document.addEventListener('astro:page-load', onPageLoad);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      document.removeEventListener('astro:before-preparation', onNavigationStart);
      document.removeEventListener('astro:page-load', onPageLoad);
    };
  }, [reduceMotion, scrollY]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          aria-hidden="true"
          className="site-transition"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
        />
      )}
    </AnimatePresence>
  );
}
