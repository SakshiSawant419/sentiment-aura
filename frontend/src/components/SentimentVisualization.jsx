import React, { useRef, useEffect } from 'react';
import p5 from 'p5';

/**
 * Sentiment Aura Visualization
 * Uses p5.js directly (no react-p5 wrapper) for better compatibility
 */

const SentimentVisualization = ({ sentiment }) => {
  const containerRef = useRef(null);
  const p5InstanceRef = useRef(null);
  const particlesRef = useRef([]);
  const timeRef = useRef(0);
  const targetColorsRef = useRef({
    bg: [10, 10, 20],
    particles: [100, 150, 255]
  });
  const currentColorsRef = useRef({
    bg: [10, 10, 20],
    particles: [100, 150, 255]
  });

  useEffect(() => {
    // Get color palette based on sentiment
    const getSentimentColors = (sentimentData) => {
      const { sentiment: type, score, attributes } = sentimentData;
      const { valence, intensity, energy } = attributes;

      let baseHue, saturation, brightness;

      if (type === 'positive') {
        baseHue = 180 + (valence * 60);
        saturation = 60 + (intensity * 40);
        brightness = 50 + (score * 30);
      } else if (type === 'negative') {
        baseHue = 280 + (valence * 40);
        saturation = 50 + (intensity * 50);
        brightness = 30 + ((1 + score) * 20);
      } else {
        baseHue = 200 + (valence * 40);
        saturation = 30 + (energy * 30);
        brightness = 40 + (intensity * 20);
      }

      return { baseHue, saturation, brightness };
    };

    // Initialize particles
    const initParticles = (p, count = 800) => {
      const particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          pos: p.createVector(p.random(p.width), p.random(p.height)),
          vel: p.createVector(0, 0),
          acc: p.createVector(0, 0),
          maxSpeed: 2,
          alpha: p.random(50, 200),
          size: p.random(1, 3)
        });
      }
      return particles;
    };

    // Create p5 sketch
    const sketch = (p) => {
      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 255);
        p.background(10, 10, 20);
        particlesRef.current = initParticles(p);
      };

      p.draw = () => {
        // Smooth color transitions
        const lerpSpeed = 0.05;
        
        for (let i = 0; i < 3; i++) {
          currentColorsRef.current.bg[i] = p.lerp(
            currentColorsRef.current.bg[i],
            targetColorsRef.current.bg[i],
            lerpSpeed
          );
          currentColorsRef.current.particles[i] = p.lerp(
            currentColorsRef.current.particles[i],
            targetColorsRef.current.particles[i],
            lerpSpeed
          );
        }

        // Semi-transparent background for trail effect
        const [bgH, bgS, bgB] = currentColorsRef.current.bg;
        p.fill(bgH, bgS, bgB, 15);
        p.noStroke();
        p.rect(0, 0, p.width, p.height);

        // Get current sentiment attributes
        const { attributes } = sentiment;
        const { intensity, energy, complexity } = attributes;

        // Calculate flow field parameters
        const noiseScale = 0.005 + (complexity * 0.005);
        const noiseStrength = 0.1 + (intensity * 0.4);
        const timeScale = 0.0005 + (energy * 0.001);
        
        timeRef.current += timeScale;

        // Update and draw particles
        const [pH, pS, pB] = currentColorsRef.current.particles;
        
        particlesRef.current.forEach((particle) => {
          // Calculate flow field force using Perlin noise
          const noiseVal = p.noise(
            particle.pos.x * noiseScale,
            particle.pos.y * noiseScale,
            timeRef.current
          );
          
          const angle = noiseVal * p.TWO_PI * 4;
          const force = p5.Vector.fromAngle(angle);
          force.mult(noiseStrength);
          
          // Apply force
          particle.acc.add(force);
          particle.vel.add(particle.acc);
          particle.vel.limit(particle.maxSpeed * (1 + energy));
          particle.pos.add(particle.vel);
          particle.acc.mult(0);

          // Wrap around edges
          if (particle.pos.x < 0) particle.pos.x = p.width;
          if (particle.pos.x > p.width) particle.pos.x = 0;
          if (particle.pos.y < 0) particle.pos.y = p.height;
          if (particle.pos.y > p.height) particle.pos.y = 0;

          // Draw particle with color variation
          const hueVariation = p.noise(particle.pos.x * 0.01, particle.pos.y * 0.01) * 30;
          p.fill(
            (pH + hueVariation) % 360,
            pS,
            pB,
            particle.alpha
          );
          p.noStroke();
          p.circle(particle.pos.x, particle.pos.y, particle.size);
        });
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    // Create p5 instance
    if (containerRef.current && !p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch, containerRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  // Update colors when sentiment changes
  useEffect(() => {
    const getSentimentColors = (sentimentData) => {
        const { sentiment: type, score, attributes } = sentimentData;
        const { valence, intensity, energy } = attributes;
      
        let baseHue, saturation, brightness;
      
        if (type === 'positive') {
          // FIRE/SUN: Pure warm spectrum
          baseHue = 15 + (valence * 45);       // Hue 15-60 (red-orange to yellow)
          saturation = 85 + (intensity * 15);  // Very saturated (85-100)
          brightness = 70 + (score * 25);      // Very bright (70-95)
          
        } else if (type === 'negative') {
          // MIDNIGHT: Deep, dark, cool
          baseHue = 240 + (valence * 40);      // Hue 240-280 (blue to purple)
          saturation = 65 + (intensity * 30);  // Rich saturation (65-95)
          brightness = 20 + ((1 + score) * 15); // Very dark (20-35)
          
        } else {
          // FOREST/WATER: Natural, balanced greens/teals
          baseHue = 140 + (valence * 60);      // Hue 140-200 (green to cyan)
          saturation = 40 + (energy * 30);     // Moderate (40-70)
          brightness = 45 + (intensity * 20);  // Medium (45-65)
        }
      
        return { baseHue, saturation, brightness };
      };

    const { baseHue, saturation, brightness } = getSentimentColors(sentiment);
    
    targetColorsRef.current = {
      bg: [baseHue - 30, saturation * 0.3, brightness * 0.3],
      particles: [baseHue, saturation, brightness]
    };
  }, [sentiment]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0 
      }}
    />
  );
};

export default SentimentVisualization;