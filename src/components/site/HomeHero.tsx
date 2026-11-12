import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Counter from '../demos/Counter';
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
          Notes, demos, and things worth figuring out along the way.
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

      <motion.aside
        aria-label="Interactive counter demo"
        className="hero-demo"
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION_DURATION.slow,
          delay: reduceMotion ? 0 : MOTION_STAGGER * 2,
          ease: MOTION_EASE,
        }}
      >
        <div className="hero-demo__meta">
          <p>A tiny interactive demo</p>
          <span className="hero-demo__status">LIVE</span>
        </div>
        <div className="hero-demo__counter">
          <Counter />
        </div>
        <p className="hero-demo__hint">STATE.VALUE → UPDATE</p>
      </motion.aside>
    </section>
  );
}
