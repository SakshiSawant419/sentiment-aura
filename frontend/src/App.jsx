import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { DeepgramClient } from './utils/deepgramClient.js';
import SentimentVisualization from './components/SentimentVisualization';
import TranscriptDisplay from './components/TranscriptDisplay';
import KeywordsDisplay from './components/KeywordsDisplay';
import Controls from './components/Controls';
import './App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;

function App() {
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentInterim, setCurrentInterim] = useState('');
  const [sentiment, setSentiment] = useState({
    sentiment: 'neutral',
    score: 0,
    keywords: [],
    attributes: {
      intensity: 0.5,
      energy: 0.5,
      valence: 0.5,
      complexity: 0.5
    }
  });
  const [keywords, setKeywords] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs
  const deepgramClientRef = useRef(null);
  const processingQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  /**
   * Process finalized transcript text through backend
   */
  const processText = useCallback(async (text) => {
    if (!text.trim() || text.length < 10) {
      console.log('Skipping short text:', text);
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📤 Sending to backend:', text);

      const response = await axios.post(
        `${BACKEND_URL}/process_text`,
        { text },
        {
          timeout: 15000,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('📥 Received sentiment:', response.data);

      // Update sentiment state
      setSentiment(response.data);
      
      // Add new keywords with timestamps for animation
      const newKeywords = response.data.keywords.map(keyword => ({
        text: keyword,
        id: `${keyword}-${Date.now()}-${Math.random()}`,
        timestamp: Date.now()
      }));
      
      setKeywords(prev => [...prev, ...newKeywords].slice(-20)); // Keep last 20

    } catch (err) {
      console.error('❌ Error processing text:', err);
      
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - OpenAI API is slow');
      } else if (err.response) {
        setError(`Backend error: ${err.response.data?.detail || err.message}`);
      } else if (err.request) {
        setError('Cannot reach backend - is it running?');
      } else {
        setError(`Error: ${err.message}`);
      }
      
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Queue-based text processing to handle rapid final transcripts
   */
  const queueTextProcessing = useCallback((text) => {
    processingQueueRef.current.push(text);
    
    // Process queue
    const processQueue = async () => {
      if (isProcessingRef.current || processingQueueRef.current.length === 0) {
        return;
      }

      isProcessingRef.current = true;
      const textToProcess = processingQueueRef.current.shift();
      
      await processText(textToProcess);
      
      isProcessingRef.current = false;
      
      // Process next in queue
      if (processingQueueRef.current.length > 0) {
        setTimeout(processQueue, 100);
      }
    };

    processQueue();
  }, [processText]);

  /**
   * Handle transcript updates from Deepgram
   */
  const handleTranscript = useCallback((data) => {
    console.log('📝 Transcript:', data.text, '| Final:', data.isFinal);

    if (data.isFinal) {
      // Add to permanent transcript
      setTranscript(prev => [...prev, {
        text: data.text,
        timestamp: data.timestamp,
        id: `transcript-${data.timestamp}`
      }]);
      
      // Clear interim
      setCurrentInterim('');
      
      // Queue for sentiment analysis
      queueTextProcessing(data.text);
    } else {
      // Update interim transcript
      setCurrentInterim(data.text);
    }
  }, [queueTextProcessing]);

  /**
   * Handle Deepgram errors
   */
  const handleDeepgramError = useCallback((errorMessage) => {
    console.error('Deepgram error:', errorMessage);
    setError(errorMessage);
    setIsRecording(false);
    
    setTimeout(() => setError(null), 5000);
  }, []);

  /**
   * Start recording
   */
  const startRecording = async () => {
    if (!DEEPGRAM_API_KEY) {
      setError('Deepgram API key not configured');
      return;
    }

    try {
      setError(null);
      
      // Create new Deepgram client
      deepgramClientRef.current = new DeepgramClient(
        DEEPGRAM_API_KEY,
        handleTranscript,
        handleDeepgramError
      );

      await deepgramClientRef.current.start();
      setIsRecording(true);
      
      // Reset state
      setTranscript([]);
      setCurrentInterim('');
      setKeywords([]);
      setSentiment({
        sentiment: 'neutral',
        score: 0,
        keywords: [],
        attributes: {
          intensity: 0.5,
          energy: 0.5,
          valence: 0.5,
          complexity: 0.5
        }
      });

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(`Failed to start: ${err.message}`);
      setIsRecording(false);
    }
  };

  /**
   * Stop recording
   */
  const stopRecording = () => {
    if (deepgramClientRef.current) {
      deepgramClientRef.current.stop();
      deepgramClientRef.current = null;
    }
    setIsRecording(false);
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (deepgramClientRef.current) {
        deepgramClientRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="app">
      {/* Background Visualization */}
      <div className="visualization-container">
        <SentimentVisualization sentiment={sentiment} />
      </div>

      {/* Overlay UI */}
      <div className="ui-overlay">
        {/* Header */}
        <header className="app-header">
          <h1 className="app-title">Sentiment Aura</h1>
          <p className="app-subtitle">Real-time emotional visualization</p>
        </header>

        {/* Controls */}
        <Controls
          isRecording={isRecording}
          isProcessing={isProcessing}
          onStart={startRecording}
          onStop={stopRecording}
        />

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}

        {/* Content Area */}
        <div className="content-grid">
          {/* Transcript */}
          <TranscriptDisplay
            transcript={transcript}
            currentInterim={currentInterim}
            isRecording={isRecording}
          />

          {/* Keywords */}
          <KeywordsDisplay keywords={keywords} />
        </div>

        {/* Status Indicator */}
        <div className="status-bar">
          <div className="status-item">
            <span className={`status-dot ${isRecording ? 'active' : ''}`} />
            {isRecording ? 'Recording' : 'Idle'}
          </div>
          <div className="status-item">
            Sentiment: <strong>{sentiment.sentiment}</strong>
          </div>
          <div className="status-item">
            Transcripts: <strong>{transcript.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;