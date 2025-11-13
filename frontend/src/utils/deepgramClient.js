/**
 * Deepgram WebSocket Client with PCM audio conversion
 */

const DEEPGRAM_URL = 'wss://api.deepgram.com/v1/listen';

export class DeepgramClient {
  constructor(apiKey, onTranscript, onError) {
    this.apiKey = apiKey;
    this.onTranscript = onTranscript;
    this.onError = onError;
    this.socket = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.isConnected = false;
    this.processor = null;
    this.stream = null;
  }

  /**
   * Convert Float32Array to 16-bit PCM
   */
  floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    return buffer;
  }

  /**
   * Start audio capture and streaming to Deepgram
   */
  async start() {
    try {
      console.log('🎤 Requesting microphone access...');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });

      console.log('✅ Microphone access granted');
      console.log('Audio tracks:', this.stream.getAudioTracks());

      // Create WebSocket connection to Deepgram
      const params = new URLSearchParams({
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        interim_results: 'true',
        punctuate: 'true',
        smart_format: 'true',
        model: 'nova-2',
      });

      const wsUrl = `${DEEPGRAM_URL}?${params.toString()}`;
      console.log('🔌 Connecting to Deepgram:', wsUrl);

      this.socket = new WebSocket(wsUrl, ['token', this.apiKey]);

      // Set up event handlers BEFORE opening
      this.socket.onopen = () => {
        console.log('✅ Deepgram WebSocket connected');
        this.isConnected = true;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log('📩 Deepgram message:', JSON.stringify(data, null, 2));
          
          const channel = data.channel;
          const alternatives = channel?.alternatives;
          const transcript = alternatives?.[0]?.transcript;
          const isFinal = data.is_final || false;
          
          console.log('🔍 Extracted data:', {
            hasChannel: !!channel,
            hasAlternatives: !!alternatives,
            transcript: transcript,
            isFinal: isFinal
          });
          
          if (transcript && transcript.trim()) {
            console.log(`📝 Transcript: "${transcript}" | Final: ${isFinal}`);
            this.onTranscript({
              text: transcript,
              isFinal: isFinal,
              timestamp: Date.now()
            });
          } else {
            console.log('⚠️ No transcript text (silence or processing)');
          }
        } catch (err) {
          console.error('❌ Error parsing Deepgram message:', err);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ Deepgram WebSocket error:', error);
        this.onError('WebSocket connection error');
      };

      this.socket.onclose = (event) => {
        console.log('🔌 Deepgram WebSocket closed', event);
        this.isConnected = false;
      };

      // Wait for socket to open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 10000);
        
        const originalOnOpen = this.socket.onopen;
        this.socket.onopen = (e) => {
          clearTimeout(timeout);
          originalOnOpen(e);
          resolve();
        };
        
        const originalOnError = this.socket.onerror;
        this.socket.onerror = (e) => {
          clearTimeout(timeout);
          originalOnError(e);
          reject(new Error('WebSocket connection failed'));
        };
      });

      console.log('🎙️ Setting up audio processing...');

      // Create AudioContext and processor for raw PCM
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = this.audioContext.createMediaStreamSource(this.stream);
      
      // Use ScriptProcessorNode for raw audio data
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      let chunkCount = 0;
      this.processor.onaudioprocess = (e) => {
        if (this.socket?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = this.floatTo16BitPCM(inputData);
          
          chunkCount++;
          if (chunkCount % 10 === 0) {  // Log every 10th chunk to reduce spam
            console.log(`📦 Audio chunk ${chunkCount}: ${pcmData.byteLength} bytes`);
          }
          
          this.socket.send(pcmData);
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('🎤 Recording started - speak now!');

    } catch (err) {
      console.error('❌ Error starting Deepgram client:', err);
      this.onError(`Failed to start recording: ${err.message}`);
      throw err;
    }
  }

  /**
   * Stop audio capture and close connection
   */
  stop() {
    console.log('⏹️ Stopping recording...');
    
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        console.log('🛑 Stopping track:', track.label);
        track.stop();
      });
      this.stream = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    console.log('✅ Recording stopped');
  }

  /**
   * Check if currently connected and recording
   */
  isRecording() {
    return this.isConnected && this.processor !== null;
  }
}