import React, { useState, useEffect } from 'react';

const KeywordTag = ({ keyword, delay }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Stagger appearance of keywords
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`keyword-tag ${isVisible ? 'visible' : ''}`}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {keyword.text}
    </div>
  );
};

const KeywordsDisplay = ({ keywords }) => {
  // Keep only recent keywords and ensure unique rendering
  const recentKeywords = keywords.slice(-15);

  return (
    <div className="keywords-display">
      <h2 className="section-title">Emotional Keywords</h2>
      
      <div className="keywords-container">
        {recentKeywords.length === 0 ? (
          <div className="keywords-placeholder">
            Keywords will appear here as emotions are detected...
          </div>
        ) : (
          <div className="keywords-grid">
            {recentKeywords.map((keyword, index) => (
              <KeywordTag
                key={keyword.id}
                keyword={keyword}
                delay={index * 100}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default KeywordsDisplay;