import { Html, useProgress } from '@react-three/drei';
import styles from './Loader.module.css';

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className={styles.loaderContainer}>
        <p className={styles.loaderText}>LOADING MEMORIES...</p>
        <p className={styles.loaderProgress}>{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

export default Loader;
