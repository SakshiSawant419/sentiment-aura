<h1 align="center">Sentiment Aura - Real-time emotional visualization</h1>

![Demo App](/frontend/public/screenshot-for-readme.png)

## Highlights:

- 🎨 **Tech Stack**: React 18, FastAPI, p5.js & Vite
- 🎤 **Real-time Audio Transcription** (Deepgram WebSocket API)
- 🧠 **AI Sentiment Analysis** (OpenAI GPT-4o-mini)
- 🌊 **Generative Art Visualization** (Perlin Noise Fields)
- 🎭 **Emotion-Driven Colors** (Warm/Cool/Neutral palettes)
- ✨ **Flowing Ribbon Effects** (800+ particles + 8 ribbons)
- 💬 **Live Transcript Display** (Auto-scrolling with glassmorphism)
- 🏷️ **Animated Keyword Tags** (Graceful fade-in effects)
- 🔄 **Real-time State Updates** (WebSocket + HTTP streaming)
- 🎯 **Sentiment Parameter Mapping** (Color, motion, intensity, energy)
- 🌈 **Smooth Color Interpolation** (Lerp-based transitions)
- 💫 **Particle Glow Effects** (Shadow blur & pulsing center)
- ⚡ **Async Error Handling** (Graceful API failures)
- 🎮 **Interactive Controls** (Start/Stop recording with status indicators)
- 📊 **Status Dashboard** (Live sentiment & transcript count)
- 🔒 **CORS Security** (Origin-specific access control)

## Features

- **Real-time Audio Transcription**: Live speech-to-text using Deepgram WebSocket with auto-scrolling display
- **AI Sentiment Analysis**: Emotion detection and keyword extraction powered by OpenAI GPT-4o-mini
- **Generative Art Visualization**: 800+ particles flowing through Perlin noise fields with 8 ribbon trails
- **Emotion-Driven Colors**: 
  - 😊 **Positive** → 🟠🟡 Warm oranges and yellows (sunrise vibes)
  - 😢 **Negative** → 🔵🟣 Dark blues and purples (midnight vibes)
  - 😐 **Neutral** → 🩵 Cyan and teal (ocean vibes)
- **Smooth Transitions**: Exponential color interpolation for seamless emotional shifts
- **Animated Keywords**: Emotional tags fade in gracefully with staggered timing
- **Visual Effects**: Particle glows, pulsing center orb, and flowing gradient ribbons
- **Smart Parameter Mapping**: Intensity, energy, and complexity control particle speed, count, and flow
- **Real-time Status**: Live sentiment display, recording indicator, and transcript count
- **Robust Error Handling**: Graceful recovery from API delays and connection issues
- **Cross-platform**: Works on all modern browsers with responsive design
- **Privacy-focused**: Audio processed in real-time, never stored

## ⚙️ Setup .env Files

### Backend Environment Variables
Create a `.env` file in the `backend/` directory:
```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Deepgram API Configuration
DEEPGRAM_API_KEY=your-deepgram-api-key-here
```
---

### Frontend Environment Variables
Create a `.env` file in the `frontend/` directory:
```env
# Deepgram API (Client-side WebSocket)
VITE_DEEPGRAM_API_KEY=your-deepgram-api-key-here

# Backend API URL
VITE_BACKEND_URL=http://localhost:8000
```

## 🚀 Getting Started

### 1. Clone the Repository
```shell
git clone https://github.com/YOUR-USERNAME/sentiment-aura.git
cd sentiment-aura
```

### 2. Install Backend Dependencies
```shell
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies
```shell
cd frontend
npm install
```

### 4. Set Up Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories as shown in the [Setup .env Files](#setup-env-files) section above.

### 5. Start the Backend Server
```shell
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
python main.py
```

Backend will run at [http://localhost:8000](http://localhost:8000)

### 6. Start the Frontend Development Server

Open a new terminal window:
```shell
cd frontend
npm run dev
```

Frontend will run at [http://localhost:5173](http://localhost:5173)

### 7. Open the Application

Visit [http://localhost:5173](http://localhost:5173) in your browser and click **"Start Recording"** to begin!

---

## 8. Deployment

Connect your GitHub repository to [Vercel](https://vercel.com) for automatic deployments.

---