import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE } from './motion';

interface SiteNavbarProps {
  basePath: string;
  currentPath: string;
}

export default function SiteNavbar({ basePath, currentPath }: SiteNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [activePath, setActivePath] = useState(currentPath);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 16);
  });

  useEffect(() => {
    const updatePath = () => {
      setActivePath(window.location.pathname);
      setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('astro:page-load', updatePath);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('astro:page-load', updatePath);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const links = [
    { href: basePath, label: 'Home', path: basePath },
    { href: `${basePath}about/`, label: 'About Me', path: `${basePath}about/` },
    {
      href: `${basePath}cloud-architect/`,
      label: 'Cloud Architect',
      path: `${basePath}cloud-architect/`,
    },
    {
      href: `${basePath}database-explorer/`,
      label: 'Database Explorer',
      path: `${basePath}database-explorer/`,
    },
    { href: `${basePath}3-am/`, label: '3AM Incident Lab', path: `${basePath}3-am/` },
    { href: `${basePath}#articles`, label: 'Articles', path: `${basePath}#articles` },
  ];

  const isCurrent = (path: string) =>
    path === basePath ? activePath === basePath : activePath === path.replace(/#.*$/, '');

  return (
    <header className="site-header" data-scrolled={scrolled}>
      <nav aria-label="Main navigation" className="site-nav">
        <a aria-label="404 Job Not Found home" className="site-brand" href={basePath}>
          <span className="site-brand__mark">404</span>
          <span className="site-brand__divider" aria-hidden="true">
            /
          </span>
          <span>Job Not Found</span>
        </a>

        <div className="site-nav__links">
          {links.map((link) => (
            <a
              aria-current={isCurrent(link.path) ? 'page' : undefined}
              className="site-nav__link"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
          <a
            aria-label="LinkedIn profile (opens in a new tab)"
            className="site-nav__social"
            href="https://www.linkedin.com/in/nir-yahav/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="site-nav__social-icon" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2ZM8.34 18H5.67V9.4h2.67ZM7 8.23a1.55 1.55 0 1 1 0-3.1 1.55 1.55 0 0 1 0 3.1ZM18.34 18h-2.67v-4.19c0-1-.02-2.29-1.4-2.29s-1.62 1.1-1.62 2.22V18H9.98V9.4h2.56v1.17h.04a2.8 2.8 0 0 1 2.51-1.38c2.69 0 3.19 1.77 3.19 4.07Z"
              />
            </svg>
          </a>
          <a
            aria-label="GitHub profile (opens in a new tab)"
            className="site-nav__social"
            href="https://github.com/nyahav"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg aria-hidden="true" className="site-nav__social-icon" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.68-3.76-1.32-3.76-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.01-.69.08-.68.08-.68 1.12.08 1.72 1.15 1.72 1.15.99 1.7 2.59 1.21 3.22.93.1-.72.39-1.21.7-1.49-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.95 0 0 .94-.3 3.05 1.15a10.58 10.58 0 0 1 5.55 0c2.12-1.45 3.05-1.15 3.05-1.15.61 1.53.23 2.67.11 2.95.72.78 1.15 1.78 1.15 3 0 4.3-2.61 5.24-5.1 5.52.4.35.75 1.03.75 2.08v3.08c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"
              />
            </svg>
          </a>
        </div>

        <button
          aria-controls="mobile-site-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="site-nav__toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="site-nav__mobile"
              exit={{ opacity: 0, y: -8 }}
              id="mobile-site-menu"
              initial={reduceMotion ? false : { opacity: 0, y: -8 }}
              transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
            >
              {links.map((link, index) => (
                <motion.a
                  aria-current={isCurrent(link.path) ? 'page' : undefined}
                  className="site-nav__mobile-link"
                  href={link.href}
                  key={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: MOTION_DURATION.fast,
                    delay: reduceMotion ? 0 : index * MOTION_DURATION.fast,
                    ease: MOTION_EASE,
                  }}
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
