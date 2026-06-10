/**
 * Simple Audio Utility using Web Audio API and Speech Synthesis.
 * Securely wrapped in try/catch to ensure standard browser execution,
 * falling back gracefully if permission is blocked in iframes.
 */

let audioCtx: AudioContext | null = null;
let speechSynth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
let lastSpokenText = "";
let lastSpokenTime = 0;

// Initialize Audio Context on demand (due to user gesture restrictions)
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a warning sound depending on severity.
 * @param type "warning" (single mid-pitched beep) or "danger" (rapid high-pitched double beep)
 */
export function playAlertSound(type: 'warning' | 'danger') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'warning') {
      // Warm medium frequency warning beep (e.g., radar approach)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5 note
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Urgent, high-pitched double-beep (danger / speed limit exceeded)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.22);

      // Second beep
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(1200, ctx.currentTime);
          
          gain2.gain.setValueAtTime(0, ctx.currentTime);
          gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          
          osc2.start(ctx.currentTime);
          osc2.stop(ctx.currentTime + 0.22);
        } catch { }
      }, 250);
    }
  } catch (err) {
    console.warn("Audio Context alert play blocked or unsupported:", err);
  }
}

/**
 * Uses SpeechSynthesis to vocally announce a radar warning.
 * Throttles announcements to prevent overlap or continuous vocal slop.
 */
export function announceAlertText(text: string, force: boolean = false) {
  try {
    if (!speechSynth) return;

    const now = Date.now();
    // Protect against repeating the exact alert or speaking multiple times within 8 seconds
    if (!force && lastSpokenText === text && now - lastSpokenTime < 8000) {
      return;
    }

    // Cancel anything currently playing to prevent pileup
    speechSynth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05; // Slightly fast for responsive cockpit feel
    utterance.pitch = 1.0;
    
    // Pick a Portuguese voice if available
    const voices = speechSynth.getVoices();
    const ptVoice = voices.find(v => v.lang.startsWith('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    lastSpokenText = text;
    lastSpokenTime = now;
    speechSynth.speak(utterance);
  } catch (err) {
    console.warn("Speech Synthesis blocked or unsupported:", err);
  }
}

/**
 * Triggers a simple system text announcement check (diagnostic sound).
 */
export function triggerTestAudio() {
  playAlertSound('warning');
  setTimeout(() => {
    announceAlertText("Teste do sistema de alertas de áudio ativo.", true);
  }, 450);
}
