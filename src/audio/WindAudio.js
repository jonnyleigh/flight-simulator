import { AUDIO_MIX } from './AudioMixConstants.js';

export class WindAudio {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        const mix = AUDIO_MIX.wind;

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
            channelData[i] = Math.random() * 2 - 1;
        }

        this.noiseSource = this.audioContext.createBufferSource();
        this.noiseSource.buffer = noiseBuffer;
        this.noiseSource.loop = true;

        this.highpass = this.audioContext.createBiquadFilter();
        this.highpass.type = 'highpass';
        this.highpass.frequency.value = mix.highpassInitial;

        this.lowpass = this.audioContext.createBiquadFilter();
        this.lowpass.type = 'lowpass';
        this.lowpass.frequency.value = mix.lowpassInitial;
        this.lowpass.Q.value = mix.lowpassQ;

        this.windGain = this.audioContext.createGain();
        this.windGain.gain.value = 0;

        this.noiseSource.connect(this.highpass);
        this.highpass.connect(this.lowpass);
        this.lowpass.connect(this.windGain);
        this.windGain.connect(this.outputGain);

        this.noiseSource.start();
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    update(airspeedMs) {
        const now = this.audioContext.currentTime;
        const mix = AUDIO_MIX.wind;
        const speed = Math.max(0, airspeedMs ?? 0);
        const speedFactor = this.clamp((speed - mix.speedOffset) / mix.speedRange, 0, 1);

        const windGainTarget = speedFactor > 0
            ? mix.gainFloor + Math.pow(speedFactor, mix.gainExponent) * mix.gainScale
            : 0;
        this.windGain.gain.setTargetAtTime(windGainTarget, now, mix.gainSmoothing);

        this.highpass.frequency.setTargetAtTime(
            mix.highpassBase + speedFactor * mix.highpassScale,
            now,
            mix.filterSmoothing
        );
        this.lowpass.frequency.setTargetAtTime(
            mix.lowpassBase + speedFactor * mix.lowpassScale,
            now,
            mix.filterSmoothing
        );
    }

    dispose() {
        this.noiseSource.stop();
        this.outputGain.disconnect();
    }
}
