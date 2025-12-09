import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import styles from './Legal.module.css';

function Legal() {
    const containerRef = useRef(null);
    const titleRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.set(`.${styles.section}, .${styles.backButton}`, {
                opacity: 0,
                y: 20
            });

            // Text Decode Effect for Title
            const titleElement = titleRef.current;
            const finalText = "Legal & Credits";
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

            let iteration = 0;
            const interval = setInterval(() => {
                titleElement.innerText = finalText
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return finalText[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join("");

                if (iteration >= finalText.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3; // Speed of decoding
            }, 30);

            // Staggered Reveal Animation
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            tl.to(`.${styles.section}`, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.2,
                delay: 0.5 // Wait a bit for title to start decoding
            })
                .to(`.${styles.backButton}`, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5
                }, "-=0.3");

            // Hover effect for credit items
            const creditItems = gsap.utils.toArray(`.${styles.creditItem}`);
            creditItems.forEach((item) => {
                item.addEventListener('mouseenter', () => {
                    gsap.to(item, {
                        x: 10,
                        color: 'var(--nier-rust)',
                        duration: 0.3
                    });
                });
                item.addEventListener('mouseleave', () => {
                    gsap.to(item, {
                        x: 0,
                        color: 'var(--nier-dark)',
                        duration: 0.3
                    });
                });
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className={styles.legalPage} ref={containerRef}>
            <div className={styles.contentContainer}>
                <h1 className={styles.pageTitle} ref={titleRef}>Legal & Credits</h1>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Disclaimer</h2>
                    <p className={styles.disclaimerText}>
                        This project, "ECHOES", is created solely for educational purposes.
                        It is a non-profit demonstration of web development skills and technologies.
                        All assets, including 3D models, pictures, music and sound effects are used only for educational
                        demonstration. No commercial infringement is intended.
                        You can visit the artist's profile to support their work clicking on their names.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Credits</h2>
                    <ul className={styles.creditsList}>
                        <li className={styles.creditItem}>
                            <span className={styles.creditRole}>3D Models, Environment & Gallery</span>
                            <a href="https://sketchfab.com/navaza" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[NAVAZA]</a>
                            <a href="https://sketchfab.com/satanahuman" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[SATANAHUMAN]</a>
                            <a href="https://sketchfab.com/ConradJustin" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[CONRAD JUSTIN]</a>
                        </li>
                        <li className={styles.creditItem}>
                            <span className={styles.creditRole}>Music</span>
                            <a href="https://music.youtube.com/channel/UCQJMRn27AehDICAg77ZIP1g" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[KEIICHI OKABE]</a>
                            <a href="https://music.youtube.com/channel/UCOI9umqqAUVPoGJyys_15kw" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[MONACA]</a>
                            <a href="https://music.youtube.com/channel/UCcqCERMNIiQRD-xZ5DhSljw" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[KEIGO HOASHI]</a>
                            <a href="https://music.youtube.com/channel/UCvB4oeRet4CZR6GP8cezQxg" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[KINUYUKI TAKAHASHI]</a>
                            <a href="https://music.youtube.com/channel/UCkAyqxDCwnzRj-C56QrT87g" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[KAKERU ISHIHAMA]</a>
                            <a href="https://music.youtube.com/channel/UCNHNeGlMOJhEZpzMX6NfzOA" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[SHOTARO SEO]</a>
                        </li>
                        <li className={styles.creditItem}>
                            <span className={styles.creditRole}>Development</span>
                            <a href="https://github.com/Paburo99" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[Paburo]</a>
                            <a href="https://github.com/Barbosa-16" target="_blank" rel="noopener noreferrer" className={styles.creditName}>[Dayanix]</a>
                        </li>
                    </ul>
                </section>

                <div style={{ textAlign: 'center' }}>
                    <Link to="/" className={styles.backButton}>
                        Return to System
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Legal;
