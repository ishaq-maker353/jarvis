import { useEffect, useState, useRef } from 'react';

export function useWakeWord(accessKey: string | undefined, enabled: boolean) {
    const [keywordDetection, setKeywordDetection] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Initialize Web Speech API
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setError("Web Speech API is not supported in this browser. Please use Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Listen for partial results for speed
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
            setIsLoaded(true);
        };

        recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase().trim();
            console.log("HEARD:", transcript); // <--- Added this line
            
            // Check if the transcript contains the wake word "jarvis"
            if (transcript.includes("jarvis")) {
                console.log("WAKE WORD DETECTED IN TRANSCRIPT:", transcript);
                setKeywordDetection("Jarvis");
                
                // Reset it so it can trigger again later
                setTimeout(() => setKeywordDetection(null), 1000);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'not-allowed') {
                console.warn("Speech Recognition Error: Microphone access denied by browser.");
                setError("Microphone permission blocked. Please check your browser settings and allow microphone access for the Wake Word to function.");
            } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
                console.error("Speech Recognition Error:", event.error);
                setError(`Speech recognition error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            // Auto-restart listening if it stops but it's supposed to be enabled, 
            // EXCEPT if it was stopped due to a permissions error (to prevent an infinite loop of popups)
            if (enabled && error !== "Microphone permission blocked. Please check your browser settings and allow microphone access for the Wake Word to function.") {
                try {
                    recognition.start();
                } catch (e) {
                    setIsListening(false);
                }
            } else {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [enabled]);

    // Start/Stop based on enabled state
    useEffect(() => {
        if (enabled && recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Failed to start SpeechRecognition", e);
            }
        } else if (!enabled && recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [enabled, isListening]);

    return { 
        keywordDetection, 
        isLoaded, 
        isListening, 
        error 
    };
}
