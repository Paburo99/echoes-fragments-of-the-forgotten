import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import Form from './pages/Form/Form';
import Legal from './pages/Legal/Legal';
import { AudioProvider, useAudio } from './context/AudioContext';
import styles from './App.module.css';

function MusicButton() {
  const { isMusicPlaying, toggleMusic } = useAudio();

  return (
    <button
      className={styles.musicButton}
      onClick={toggleMusic}
      title={isMusicPlaying ? "Pause Music" : "Play Music"}
    >
      {isMusicPlaying ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" opacity="0.3" />
          <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
        </svg>
      )}
    </button>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AudioProvider>
        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>HOME</Link>
          <Link to="/about" className={styles.navLink}>ABOUT</Link>
          <Link to="/form" className={styles.navLink}>FORM</Link>
          <Link to="/legal" className={styles.navLink}>LEGAL</Link>
        </nav>

        <MusicButton />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/form" element={<Form />} />
          <Route path="/legal" element={<Legal />} />
        </Routes>
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;
