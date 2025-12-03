import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import styles from './About.module.css';
import bgHero from '../../assets/images/bg_about.avif';
import PixelatedReveal from '../../components/ui/PixelatedReveal';

const GALLERY_IMAGES = [
  '/gallery/shot2.mipmap.w1920.webp',
  '/gallery/shot7.mipmap.w1920.webp',
  '/gallery/shot5.mipmap.w1920.webp',
  '/gallery/shot10.mipmap.w1920.webp',
  '/gallery/shot2.mipmap.w1920.avif',
  '/gallery/shot6.mipmap.w1920.avif',
  '/gallery/shot0.mipmap.w1920.webp',
  '/gallery/shot7.mipmap.w1920.avif'
];

const ROADMAP = [
  { status: 'done', label: 'World Creation' },
  { status: 'done', label: 'Memory Systems' },
  { status: 'done', label: 'Audio & Emotion Integration' },
  { status: 'progress', label: 'Multiplayer Echoes' },
  { status: 'pending', label: 'Full Release' },
];

export default function About() {
  const [selectedImage, setSelectedImage] = useState(null);
  const heroRef = useRef(null);
  const heroTitleRef = useRef(null);
  const loreCardsRef = useRef([]);
  const revealRef = useRef(null);

  const addToRefs = (el) => {
    if (el && !loreCardsRef.current.includes(el)) {
      loreCardsRef.current.push(el);
    }
  };

  const handleMouseMove = (e) => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      heroRef.current.style.setProperty('--mouse-x', `${x}px`);
      heroRef.current.style.setProperty('--mouse-y', `${y}px`);

      // Pass mouse position to the pixelated reveal effect
      if (revealRef.current) {
        revealRef.current.onMouseMove(x, y);
      }
    }
  };

  useEffect(() => {
    const title = heroTitleRef.current;
    if (title) {
      gsap.fromTo(title,
        { opacity: 0, letterSpacing: '2rem' },
        { opacity: 1, letterSpacing: '0.5rem', duration: 2, ease: "power3.out" }
      );
    }

    loreCardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.to(card, {
          y: -10,
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.2
        });
      }
    });

  }, []);

  return (
    <div className={styles.aboutPage}>

      {/* --- HERO SECTION ---*/}
      <header className={styles.heroSection} ref={heroRef} onMouseMove={handleMouseMove}>
        <div className={styles.heroBgContainer}>
          <div className={`${styles.heroBg} ${styles.heroBgBW}`} style={{ backgroundImage: `url(${bgHero})` }}></div>
          <div className={styles.heroBgReveal}>
            <PixelatedReveal
              ref={revealRef}
              src={bgHero}
              gridSize={15}
              decay={0.97}
              diffusion={0.18}
              threshold={0.02}
              influenceRadius={15}
            />
          </div>
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle} ref={heroTitleRef} data-text="ECHOES">
            ECHOES
          </h1>
          <div className={styles.heroSubtitle}>
            // FRAGMENTS_OF_THE_FORGOTTEN
          </div>
          <div className={styles.scrollIndicator}>
            SCROLL_TO_PROCEED
          </div>
        </div >
      </header >

      {/* --- ABOUT SECTION ---*/}
      <section className={styles.aboutSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>
            ARCHIVE_DATA
          </h2>

          <div className={styles.loreGrid}>
            <article className={styles.loreCard} ref={addToRefs}>
              <div className={styles.loreIcon}>◈</div>
              <h3>The Great Silence</h3>
              <p>
                [RECORD 2140]: When the world went silent, we lost more than data.
                We lost ourselves. Every fragment recovered is a life reclaimed.
              </p>
            </article>

            <article className={styles.loreCard} ref={addToRefs}>
              <div className={styles.loreIcon}>◇</div>
              <h3>The Traveler</h3>
              <p>
                [SUBJECT_ID: WANDERER]: A guardian of the past.
                Mission: To visit the ruins and safeguard the precious echoes of humanity.
              </p>
            </article>

            <article className={styles.loreCard} ref={addToRefs}>
              <div className={styles.loreIcon}>◆</div>
              <h3>Memory Shards</h3>
              <p>
                [OBJECT_CLASS: FRAGMENT]: Crystallized moments of those who have witnessed life.
                Fragile. Irreplaceable.
              </p>
            </article>
          </div>

          {/* Roadmap */}
          <div className={styles.roadmapContainer}>
            <h3 className={styles.roadmapTitle}>RESTORATION_LOG</h3>
            <div className={styles.roadmapTimeline}>
              {ROADMAP.map((item, index) => (
                <div
                  key={index}
                  className={`${styles.roadmapItem} ${styles[item.status]}`}
                >
                  <div className={styles.roadmapDot} />
                  <span className={styles.roadmapLabel}>
                    [{item.status.toUpperCase()}] {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- GALLERY SECTION ---*/}
      <section className={styles.gallerySection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>
            PRECIOUS_FRAGMENTS
          </h2>

          <div className={styles.galleryGrid}>
            {GALLERY_IMAGES.map((src, index) => (
              <div
                key={index}
                className={styles.galleryItem}
                onClick={() => setSelectedImage(src)}
              >
                <img
                  src={src}
                  alt={`Memory Fragment ${index + 1}`}
                  loading="lazy"
                />
                <div className={styles.galleryOverlay}>
                  <span>VIEW_MEMORY</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lightbox Modal */}
        {selectedImage && (
          <div
            className={styles.lightbox}
            onClick={() => setSelectedImage(null)}
          >
            <button
              className={styles.lightboxClose}
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <img
              src={selectedImage}
              alt="Memory Fragment"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </section>


      {/* --- CALL TO ACTION ---*/}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>PRESERVE_YOUR_ECHO</h2>
          <p className={styles.ctaText}>
            Your memories are the only thing that remains.<br />
            Entrust them to the archive, and they will never fade.
          </p>
          <Link to="/form" className={styles.ctaButton}>
            SAVE_A_MEMORY
          </Link>
        </div>
      </section>

      {/* --- FOOTER ---*/}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoMain}>ECHOES</span>
            <span className={styles.footerLogoSub}> // VER 1.0</span>
          </div>

          <nav className={styles.footerNav}>
            <Link to="/">[HOME]</Link>
            <Link to="/about">[ARCHIVE]</Link>
            <Link to="/form">[UPLOAD]</Link>
          </nav>

          <p className={styles.footerCopyright}>
            © 2025 PROJECT_ECHOES.
          </p>
        </div>
      </footer>
    </div >
  );
}
