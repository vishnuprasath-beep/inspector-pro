import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

/**
 * Inspectra Pro — Hands-Free Voice-to-Text Dictation Component
 * Enables site auditors & contractors wearing heavy gloves to dictate observations,
 * defect measurements, and remediation notes directly into form fields.
 */
export default function VoiceDictationButton({
  onTranscript,
  currentValue = '',
  placeholder = 'Dictate...',
  style = {},
  size = 'md', // 'sm' | 'md' | 'lg'
  buttonText = null
}) {
  const toast = useToast();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const isSupported = typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Optimized for Indian English & technical construction terms

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event) => {
      let finalSpeech = '';
      let interimSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSpeech += transcript;
        } else {
          interimSpeech += transcript;
        }
      }

      setInterimText(interimSpeech);

      if (finalSpeech) {
        // Append neatly with space
        const trimmed = finalSpeech.trim();
        const updated = currentValue ? `${currentValue.trim()} ${trimmed}` : trimmed;
        if (onTranscript) {
          onTranscript(updated);
        }
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Voice Dictation] Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast?.error('Microphone access was denied. Please allow microphone permission in your browser settings.');
      } else if (event.error === 'network') {
        toast?.error('Voice recognition network timeout. Please check your internet connection.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      } catch (e) {}
    };
  }, [currentValue, onTranscript, isSupported]);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSupported) {
      toast?.info('Voice dictation is supported in modern Chrome, Edge, and Safari browsers.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (err) {}
      setIsListening(false);
      setInterimText('');
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  };

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 13 : 16;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
      <button
        type="button"
        onClick={toggleListening}
        className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: isSmall ? '4px 8px' : '6px 12px',
          fontSize: isSmall ? 11 : 12,
          fontWeight: 700,
          borderRadius: 8,
          transition: 'all 0.2s ease',
          backgroundColor: isListening ? '#ef4444' : 'rgba(56, 189, 248, 0.12)',
          borderColor: isListening ? '#dc2626' : 'rgba(56, 189, 248, 0.3)',
          color: isListening ? '#ffffff' : 'var(--accent-cyan)',
          boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.5)' : 'none',
          cursor: 'pointer',
          ...style
        }}
        title={isListening ? 'Click to Stop Dictating' : 'Click to Dictate Voice Notes'}
      >
        {isListening ? (
          <>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fff' }} className="pulse-active" />
            <Mic size={iconSize} />
            <span>{buttonText || 'Listening...'}</span>
          </>
        ) : (
          <>
            <Mic size={iconSize} />
            {buttonText && <span>{buttonText}</span>}
          </>
        )}
      </button>

      {/* Floating interim indicator while speaking */}
      {isListening && interimText && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: 0,
            marginBottom: 6,
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f8fafc',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Volume2 size={12} color="#f87171" className="pulse-active" />
          <span style={{ fontStyle: 'italic', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            "{interimText}"
          </span>
        </div>
      )}
    </div>
  );
}
