import { AUDIO_MIX } from './AudioMixConstants.js';

export class AmbientAudio {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        const mix = AUDIO_MIX.ambient;

        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = mix.outputGain;
        this.outputGain.connect(outputNode);

        const noiseBuffer = this.audioContext.createBuffer(
            1,
            this.audioContext.sampleRate * mix.noiseBufferSeconds,
            this.audioContext.sampleRate
        );
        const channelData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
            channelData[i] = (Math.random() * 2 - 1) * mix.noiseAmplitude;
        }

        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = noiseBuffer;
        this.noiseSource.loop = true;

        this.lowpass = this.audioContext.createBiquadFilter();
        this.lowpass.type = 'lowpass';
        this.lowpass.frequency.value = mix.lowpassInitial;
        this.lowpass.Q.value = mix.lowpassQ;

        this.highpass = this.audioContext.createBiquadFilter();
        this.highpass.type = 'highpass';
        this.highpass.frequency.value = mix.highpassInitial;

        this.rumbleGain = this.audioContext.createGain();
        this.rumbleGain.gain.value = 0;

        this.noiseSource.connect(this.lowpass);
        this.lowpass.connect(this.highpass);
        this.highpass.connect(this.rumbleGain);
        this.rumbleGain.connect(this.outputGain);

        this.noiseSource.start();
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    update(isOnGround, groundSpeedMs, wheelBrake) {
        const now = this.audioContext.currentTime;
        const mix = AUDIO_MIX.ambient;
        const speed = Math.max(0, groundSpeedMs ?? 0);
        const speedFactor = this.clamp(speed / mix.speedRange, 0, 1);

        let targetGain = 0;
        if (isOnGround && speedFactor > mix.activationThreshold) {
            targetGain = mix.baseGain + speedFactor * mix.speedGainScale;
            if (wheelBrake) {
                targetGain += speedFactor * mix.brakeGainScale;
            }
        }

        this.rumbleGain.gain.setTargetAtTime(targetGain, now, mix.gainSmoothing);
        this.lowpass.frequency.setTargetAtTime(
            mix.lowpassBase + speedFactor * mix.lowpassScale,
            now,
            mix.filterSmoothing
        );
        this.highpass.frequency.setTargetAtTime(
            mix.highpassBase + speedFactor * mix.highpassScale,
            now,
            mix.filterSmoothing
        );
    }

    dispose() {
        this.noiseSource.stop();
        this.outputGain.disconnect();
    }
}
