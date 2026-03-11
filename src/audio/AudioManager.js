import { EngineAudio } from './EngineAudio.js';
import { WindAudio } from './WindAudio.js';
import { WarningAudio } from './WarningAudio.js';
import { AmbientAudio } from './AmbientAudio.js';
import { AUDIO_MIX } from './AudioMixConstants.js';

export class AudioManager {
    constructor(gameState) {
        this.gameState = gameState;

        this.initialized = false;
        this.audioContext = null;

        this.masterGain = null;
        this.engineAudio = null;
        this.windAudio = null;
        this.warningAudio = null;
        this.ambientAudio = null;
    }

    init() {
        if (this.initialized) return;

        const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextCtor) {
            console.warn('Web Audio API not supported in this browser.');
            return;
        }

        this.audioContext = new AudioContextCtor();

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0;
        this.masterGain.connect(this.audioContext.destination);

        this.engineAudio = new EngineAudio(this.audioContext, this.masterGain);
        this.windAudio = new WindAudio(this.audioContext, this.masterGain);
        this.warningAudio = new WarningAudio(this.audioContext, this.masterGain);
        this.ambientAudio = new AmbientAudio(this.audioContext, this.masterGain);

        this.initialized = true;
    }

    resume() {
        if (!this.initialized || !this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch((error) => {
                console.warn('AudioContext resume failed:', error);
            });
        }
    }

    update(dt) {
        if (!this.initialized || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const mix = AUDIO_MIX.manager;
        const aircraft = this.gameState.aircraft;
        const controls = this.gameState.controls;
        const flags = this.gameState.flags;

        const shouldMute =
            this.gameState.camera.mode === 'intro' ||
            flags.isPaused ||
            flags.showMap ||
            flags.isCrashed;

        this.masterGain.gain.setTargetAtTime(
            shouldMute ? 0 : mix.unmutedGain,
            now,
            shouldMute ? mix.muteTimeConstant : mix.unmuteTimeConstant
        );

        const throttle = Math.max(0, Math.min(1, controls.throttle ?? 0));
        const rpm = Math.max(0, aircraft.rpm ?? 0);
        const airspeedMs = Math.max(0, aircraft.airspeed ?? 0);
        const velocityX = aircraft.velocity?.x ?? 0;
        const velocityZ = aircraft.velocity?.z ?? 0;
        const groundSpeedMs = Math.sqrt((velocityX * velocityX) + (velocityZ * velocityZ));

        const terrainHeight = this.gameState.world.terrainHeight ?? 0;
        const aircraftY = aircraft.position?.y ?? 0;
        const isOnGround = aircraftY <= terrainHeight + mix.groundContactEpsilon;

        this.engineAudio.update(dt, !!aircraft.engineRunning, throttle, rpm);
        this.windAudio.update(airspeedMs);
        this.warningAudio.update(!!flags.stallWarning && !!aircraft.engineRunning);
        this.ambientAudio.update(isOnGround, groundSpeedMs, !!controls.wheelBrake);
    }

    dispose() {
        if (!this.initialized) return;

        this.engineAudio?.dispose();
        this.windAudio?.dispose();
        this.warningAudio?.dispose();
        this.ambientAudio?.dispose();
        this.masterGain?.disconnect();

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.initialized = false;
    }
}
