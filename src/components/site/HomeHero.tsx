import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from './motion';

interface HomeHeroProps {
  basePath: string;
}

export default function HomeHero({ basePath }: HomeHeroProps) {
  const reduceMotion = useReducedMotion();
  const content = {
    hidden: { opacity: 0, y: 22 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section aria-labelledby="home-title" className="home-hero">
      <motion.div
        animate="visible"
        className="home-hero__copy"
        initial={reduceMotion ? false : 'hidden'}
        variants={{
          hidden: {},
          visible: {
            transition: {
              duration: MOTION_DURATION.slow,
              ease: MOTION_EASE,
              staggerChildren: reduceMotion ? 0 : MOTION_STAGGER,
            },
          },
        }}
      >
        <motion.p
          className="eyebrow-token"
          transition={{ duration: MOTION_DURATION.slow }}
          variants={content}
        >
          A place for ideas and experiments
        </motion.p>
        <motion.h1
          id="home-title"
          transition={{ duration: MOTION_DURATION.slow }}
          variants={content}
        >
          404 <span aria-hidden="true">—</span>
          <br />
          Job Not Found
        </motion.h1>
        <motion.p
          className="home-hero__intro"
          transition={{ duration: MOTION_DURATION.slow }}
          variants={content}
        >
          I'm Yahav, a software engineer, and this is my playground
        </motion.p>
        <motion.div
          className="home-hero__actions"
          transition={{ duration: MOTION_DURATION.slow }}
          variants={content}
        >
          <a className="action-link action-link--primary" href="#projects">
            Explore projects <ArrowDown aria-hidden="true" size={16} />
          </a>
          <a className="action-link" href={`${basePath}about/`}>
            About me <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        className="home-globe"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION_DURATION.slow,
          delay: reduceMotion ? 0 : MOTION_STAGGER * 2,
          ease: MOTION_EASE,
        }}
      >
        <svg
          aria-label="Animated globe of connected ideas"
          className="home-globe__art"
          role="img"
          viewBox="0 0 400 400"
        >
          <defs>
            <radialGradient id="globe-surface" cx="34%" cy="28%" r="74%">
              <stop offset="0%" stopColor="#28445a" />
              <stop offset="68%" stopColor="#142a3b" />
              <stop offset="100%" stopColor="#0b1825" />
            </radialGradient>
            <radialGradient id="globe-glow">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity=".22" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <clipPath id="globe-clip">
              <circle cx="200" cy="200" r="132" />
            </clipPath>
          </defs>

          <circle className="home-globe__aura" cx="200" cy="200" r="188" fill="url(#globe-glow)" />
          <g className="home-globe__orbit home-globe__orbit--outer">
            <ellipse cx="200" cy="200" rx="174" ry="76" />
            <circle className="home-globe__satellite" cx="200" cy="124" r="4" />
          </g>
          <g className="home-globe__orbit home-globe__orbit--inner">
            <ellipse cx="200" cy="200" rx="158" ry="102" />
            <circle
              className="home-globe__satellite home-globe__satellite--second"
              cx="200"
              cy="98"
              r="3"
            />
          </g>

          <circle className="home-globe__sphere" cx="200" cy="200" r="132" />
          <g clipPath="url(#globe-clip)">
            <path
              className="home-globe__continent"
              d="m93 129 19-17 19 5 10 16 21 5 8 15-12 11 8 16-15 12-4 22-18 5-10-14-17-2-8-17-18-8-2-22 12-13-3-14 10-10Zm117-55 18 2 10 14 21 3 12 13 20 5 9 18-13 12-17-5-8 12-20-4-10 14-15-5-3-19-14-10 2-17-12-11 5-15Zm63 83 21-4 15 13-5 17 10 13-11 15-19-3-5-17-17-8 11-12Zm-75 64 18-11 20 6 8 19-9 16-7 22-13 13-11-18 1-24-12-13 5-10Z"
              fill="currentColor"
              fillOpacity=".15"
              stroke="currentColor"
              strokeOpacity=".36"
              strokeWidth="1.2"
            />
            <g className="home-globe__latitude">
              <ellipse cx="200" cy="200" rx="130" ry="40" />
              <ellipse cx="200" cy="200" rx="130" ry="82" />
              <ellipse cx="200" cy="200" rx="130" ry="112" />
            </g>
            <g className="home-globe__longitude">
              <ellipse cx="200" cy="200" rx="38" ry="130" />
              <ellipse cx="200" cy="200" rx="78" ry="130" />
              <ellipse cx="200" cy="200" rx="110" ry="130" />
            </g>
            <path className="home-globe__route" d="M73 221c45-54 70 42 119-14s80-4 133-51" />
            <path
              className="home-globe__route home-globe__route--secondary"
              d="M102 97c30 48 7 76 48 106s17 63 55 96"
            />
            <circle className="home-globe__node home-globe__node--one" cx="192" cy="207" r="4" />
            <circle className="home-globe__node home-globe__node--two" cx="325" cy="156" r="3" />
            <circle className="home-globe__node home-globe__node--three" cx="149" cy="302" r="3" />
            <circle className="home-globe__node home-globe__node--four" cx="113" cy="161" r="2.5" />
          </g>
          <circle className="home-globe__rim" cx="200" cy="200" r="132" />
        </svg>
      </motion.div>
    </section>
  );
}
