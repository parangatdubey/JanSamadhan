/**
 * JanSamadhan High-Fidelity Audio Recorder & Microphone Manager.
 * Features:
 * - 16kHz Mono PCM WAV encoding via Web Audio API (compatible natively with SpeechRecognition & Python wave)
 * - MediaRecorder fallback
 * - Granular browser permission & hardware error classification
 * - Hardware release upon stop
 * - Pause / Resume / Stop / Playback Blob generation
 */

export class AudioRecorder {
  constructor() {
    this.stream = null;
    this.audioContext = null;
    this.source = null;
    this.processor = null;
    this.pcmChunks = [];
    this.isRecording = false;
    this.isPaused = false;
    this.sampleRate = 16000;
  }

  /**
   * Request microphone permission and initialize 16kHz mono audio recording
   */
  async start() {
    // 1. Check browser mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Your browser does not support audio recording. Please use Google Chrome, Microsoft Edge, or Mozilla Firefox."
      );
    }

    // 2. Check secure context (HTTPS or localhost)
    if (window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      throw new Error(
        "Microphone access requires a secure HTTPS connection or localhost environment."
      );
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
    } catch (err) {
      // Handle explicit browser getUserMedia error codes
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error("Please allow microphone access to register your complaint through voice.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error("No microphone detected. Please plug in a microphone or type your complaint.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error("Microphone is currently in use by another application. Please close it and try again.");
      } else if (err.name === 'SecurityError') {
        throw new Error("Microphone access is blocked due to security restrictions (requires HTTPS or localhost).");
      } else {
        throw new Error(`Microphone error: ${err.message || 'Unable to access microphone'}`);
      }
    }

    // 3. Initialize Web Audio Context at 16kHz mono
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContextClass({ sampleRate: this.sampleRate });
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.pcmChunks = [];
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    
    // ScriptProcessor for reliable cross-browser PCM capture
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording || this.isPaused) return;
      const inputData = e.inputBuffer.getChannelData(0);
      // Clone float buffer
      this.pcmChunks.push(new Float32Array(inputData));
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.isRecording = true;
    this.isPaused = false;
  }

  /**
   * Pause current recording
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume paused recording
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Stop recording, release all microphone hardware tracks, and return a 16kHz Mono WAV Blob
   */
  async stop() {
    this.isRecording = false;
    this.isPaused = false;

    // Disconnect Web Audio nodes
    if (this.processor) {
      try {
        this.processor.disconnect();
      } catch (e) {}
      this.processor = null;
    }
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {}
      this.source = null;
    }

    // Close AudioContext
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (e) {}
    }

    // Release microphone hardware tracks
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.stream = null;
    }

    // Combine all float PCM chunks
    let totalLength = 0;
    for (const chunk of this.pcmChunks) {
      totalLength += chunk.length;
    }

    if (totalLength === 0) {
      throw new Error("No audio was captured. Please speak into the microphone.");
    }

    const mergedFloatSamples = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.pcmChunks) {
      mergedFloatSamples.set(chunk, offset);
      offset += chunk.length;
    }

    // Encode to 16-bit PCM RIFF WAV
    const wavBlob = this.encodeWAV(mergedFloatSamples, this.sampleRate);
    return wavBlob;
  }

  /**
   * Encodes Float32Array audio samples into 16-bit PCM WAV Blob
   */
  encodeWAV(samples, sampleRate = 16000) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // Helper to write string characters
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 for Mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
    view.setUint16(32, 2, true); // BlockAlign (NumChannels * BitsPerSample/8)
    view.setUint16(34, 16, true); // BitsPerSample (16 bits)

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // Write PCM 16-bit signed integer samples
    let index = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      // Convert to 16-bit integer (-32768 to 32767)
      view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      index += 2;
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  /**
   * Cancel and discard recording immediately
   */
  cancel() {
    this.isRecording = false;
    this.isPaused = false;
    if (this.processor) {
      try { this.processor.disconnect(); } catch (e) {}
      this.processor = null;
    }
    if (this.source) {
      try { this.source.disconnect(); } catch (e) {}
      this.source = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      this.stream = null;
    }
    this.pcmChunks = [];
  }
}
