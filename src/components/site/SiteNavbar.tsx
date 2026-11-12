import { useEffect, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE } from './motion';

interface SiteNavbarProps {
  basePath: string;
  currentPath: string;
  aboutLabel: string;
  articlesLabel: string;
}

export default function SiteNavbar({
  basePath,
  currentPath,
  aboutLabel,
  articlesLabel,
}: SiteNavbarProps) {
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
    { href: `${basePath}about/`, label: aboutLabel, path: `${basePath}about/` },
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
    { href: `${basePath}3-am/`, label: '3 AM Lab', path: `${basePath}3-am/` },
    { href: `${basePath}#articles`, label: articlesLabel, path: `${basePath}#articles` },
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
            in <ArrowUpRight aria-hidden="true" size={14} />
          </a>
          <a
            aria-label="GitHub profile (opens in a new tab)"
            className="site-nav__social"
            href="https://github.com/nyahav"
            rel="noopener noreferrer"
            target="_blank"
          >
            GH <ArrowUpRight aria-hidden="true" size={14} />
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
