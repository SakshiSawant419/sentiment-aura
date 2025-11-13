import React from 'react';

const Controls = ({ isRecording, isProcessing, onStart, onStop }) => {
  return (
    <div className="controls">
      {!isRecording ? (
        <button 
          className="control-button start-button"
          onClick={onStart}
          disabled={isProcessing}
        >
          <span className="button-icon">🎤</span>
          Start Recording
        </button>
      ) : (
        <button 
          className="control-button stop-button"
          onClick={onStop}
        >
          <span className="button-icon">⏹️</span>
          Stop Recording
        </button>
      )}
      
      {isProcessing && (
        <div className="processing-indicator">
          <div className="spinner" />
          <span>Analyzing sentiment...</span>
        </div>
      )}
    </div>
  );
};

export default Controls;