import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import gsap from 'gsap';
import styles from './Form.module.css';
import bgImage from '../../assets/images/bg_form.avif';

function Form() {
  const [formData, setFormData] = useState({
    name: '',
    memory: '',
    emotion: 'hope'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const formRef = useRef(null);
  const titleRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    // Entrance Animation
    const tl = gsap.timeline();

    // Background Animation 
    if (bgRef.current) {
      gsap.to(bgRef.current, { opacity: 1, duration: 2 });
    }

    tl.fromTo(titleRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1, ease: "power2.out" }
    )
      .fromTo(formRef.current.children,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.8, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );

  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToast(null);

    // Simulate upload delay for effect
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const { error } = await supabase
        .from('memories')
        .insert({
          user_name: formData.name,
          emotion: formData.emotion,
          memory_content: formData.memory
        });

      if (error) throw error;

      setToast({ type: 'success', message: '>> MEMORY_SECURED_IN_ARCHIVE' });
      setFormData({ name: '', memory: '', emotion: 'hope' });

      gsap.to(formRef.current, {
        opacity: 0.5,
        yoyo: true,
        repeat: 1,
        duration: 0.1,
        ease: "steps(1)"
      });

    } catch (error) {
      console.error('Error saving memory:', error);
      setToast({ type: 'error', message: '>> ERROR: UPLOAD_FAILED' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formPage}>
      {/* Background Chromatic Aberration */}
      <div className={styles.bgContainer} ref={bgRef}>
        <div className={`${styles.bgLayer} ${styles.bgLayerRed}`} style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className={`${styles.bgLayer} ${styles.bgLayerGreen}`} style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className={`${styles.bgLayer} ${styles.bgLayerBlue}`} style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className={styles.bgOverlay}></div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}

      <div className={styles.formContainer}>
        <h1 className={styles.formTitle} ref={titleRef}>MEMORY_ARCHIVE</h1>
        <p className={styles.formSubtitle}>// PRESERVING_PRECIOUS_DATA</p>

        <form onSubmit={handleSubmit} className={styles.memoryForm} ref={formRef}>
          <div className={styles.formGroup}>
            <label htmlFor="name">SUBJECT_NAME</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Who does this memory belong to?"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="emotion">EMOTIONAL_SIGNATURE</label>
            <select
              id="emotion"
              name="emotion"
              value={formData.emotion}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="hope">HOPE [Cherished]</option>
              <option value="sorrow">SORROW [Deep]</option>
              <option value="joy">JOY [Radiant]</option>
              <option value="fear">FEAR [Guarded]</option>
              <option value="anger">ANGER [Burning]</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="memory">MEMORY_DATA</label>
            <textarea
              id="memory"
              name="memory"
              value={formData.memory}
              onChange={handleChange}
              placeholder="Describe the moment you wish to save..."
              rows={5}
              required
              disabled={isSubmitting}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting ? 'ARCHIVING...' : 'PRESERVE_MEMORY'}
          </button>
        </form>

        <Link to="/" className={styles.backLink}>
          [ RETURN_TO_MAIN_MENU ]
        </Link>
      </div>
    </div>
  );
}

export default Form;
