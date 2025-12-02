import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import bgMusic from '../assets/music/bg_music.mp3';

const AudioContext = createContext(null);

export function AudioProvider({ children }) {
    const [isMusicEnabled, setIsMusicEnabled] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isBgPaused, setIsBgPaused] = useState(false);
    const bgAudioRef = useRef(null);
    const emotionAudioRef = useRef(null);
    const pendingEmotionTrack = useRef(null);

    // Initialize background audio
    useEffect(() => {
        bgAudioRef.current = new Audio(bgMusic);
        bgAudioRef.current.loop = true;
        bgAudioRef.current.volume = 0.3;

        return () => {
            if (bgAudioRef.current) {
                bgAudioRef.current.pause();
                bgAudioRef.current = null;
            }
            if (emotionAudioRef.current) {
                emotionAudioRef.current.pause();
                emotionAudioRef.current = null;
            }
        };
    }, []);

    // Play emotion music
    const playEmotionMusic = useCallback((trackPath) => {
        pendingEmotionTrack.current = trackPath;

        if (emotionAudioRef.current) {
            emotionAudioRef.current.pause();
            emotionAudioRef.current = null;
        }

        if (!isMusicEnabled) return;

        // Create and play new emotion audio
        emotionAudioRef.current = new Audio(trackPath);
        emotionAudioRef.current.volume = 0.4;
        emotionAudioRef.current.play().catch(err => console.log('Emotion audio play failed:', err));
    }, [isMusicEnabled]);

    // Toggle background music
    const toggleMusic = useCallback(() => {
        if (!bgAudioRef.current) return;

        if (isMusicEnabled) {
            bgAudioRef.current.pause();
            if (emotionAudioRef.current) {
                emotionAudioRef.current.pause();
            }
            setIsMusicPlaying(false);
            setIsMusicEnabled(false);
        } else {
            setIsMusicEnabled(true);
            setIsMusicPlaying(true);

            if (isBgPaused) {
                // If we are in a memory/paused state, check if we have a pending emotion track
                if (pendingEmotionTrack.current) {
                    if (emotionAudioRef.current) {
                        emotionAudioRef.current.pause();
                    }
                    emotionAudioRef.current = new Audio(pendingEmotionTrack.current);
                    emotionAudioRef.current.volume = 0.4;
                    emotionAudioRef.current.play().catch(err => console.log('Emotion audio play failed:', err));
                } else if (emotionAudioRef.current) {
                    // Resume existing if any
                    emotionAudioRef.current.play().catch(err => console.log('Emotion audio resume failed:', err));
                }
            } else {
                // resume BG music
                bgAudioRef.current.play().then(() => {
                }).catch(err => console.log('Audio play failed:', err));
            }
        }
    }, [isMusicEnabled, isBgPaused]);

    // Pause background music
    const pauseBgMusic = useCallback(() => {
        if (bgAudioRef.current) {
            bgAudioRef.current.pause();
        }
        setIsBgPaused(true);
    }, []);

    // Resume background music
    const resumeBgMusic = useCallback(() => {
        setIsBgPaused(false);
        if (bgAudioRef.current && isMusicEnabled) {
            setTimeout(() => {
                bgAudioRef.current.play().then(() => {
                    setIsMusicPlaying(true);
                }).catch(err => console.log('Resume audio failed:', err));
            }, 300);
        }
    }, [isMusicEnabled]);

    // Stop emotion music with fade
    const stopEmotionMusic = useCallback(() => {
        pendingEmotionTrack.current = null; // Clear pending

        if (emotionAudioRef.current) {
            const fadeOut = setInterval(() => {
                if (emotionAudioRef.current && emotionAudioRef.current.volume > 0.05) {
                    emotionAudioRef.current.volume -= 0.05;
                } else {
                    clearInterval(fadeOut);
                    if (emotionAudioRef.current) {
                        emotionAudioRef.current.pause();
                        emotionAudioRef.current = null;
                    }
                }
            }, 50);
        }
    }, []);

    const value = {
        isMusicEnabled,
        isMusicPlaying,
        toggleMusic,
        pauseBgMusic,
        resumeBgMusic,
        playEmotionMusic,
        stopEmotionMusic
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
}
