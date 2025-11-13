import React, { useEffect, useRef } from 'react';

const TranscriptDisplay = ({ transcript, currentInterim, isRecording }) => {
  const containerRef = useRef(null);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript, currentInterim]);

  return (
    <div className="transcript-display">
      <h2 className="section-title">Live Transcript</h2>
      
      <div className="transcript-container" ref={containerRef}>
        {transcript.length === 0 && !currentInterim && (
          <div className="transcript-placeholder">
            {isRecording 
              ? '🎤 Listening... Start speaking!'
              : '👋 Click "Start Recording" to begin'}
          </div>
        )}

        {transcript.map((item) => (
          <div key={item.id} className="transcript-item final">
            {item.text}
          </div>
        ))}

        {currentInterim && (
          <div className="transcript-item interim">
            {currentInterim}
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;