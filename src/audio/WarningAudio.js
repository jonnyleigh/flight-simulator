import { AUDIO_MIX } from './AudioMixConstants.js';

export class WarningAudio {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        const mix = AUDIO_MIX.warning;

        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = mix.outputGain;
        this.outputGain.connect(outputNode);

        this.warningGain = this.audioContext.createGain();
        this.warningGain.gain.value = 0;
        this.warningGain.connect(this.outputGain);

        this.oscA = this.audioContext.createOscillator();
        this.oscA.type = 'square';
        this.oscA.frequency.value = mix.oscAInitialFrequency;

        this.oscB = this.audioContext.createOscillator();
        this.oscB.type = 'sine';
        this.oscB.frequency.value = mix.oscBInitialFrequency;

        this.mixA = this.audioContext.createGain();
        this.mixA.gain.value = mix.mixA;
        this.mixB = this.audioContext.createGain();
        this.mixB.gain.value = mix.mixB;

        this.oscA.connect(this.mixA);
        this.oscB.connect(this.mixB);
        this.mixA.connect(this.warningGain);
        this.mixB.connect(this.warningGain);

        this.oscA.start();
        this.oscB.start();
    }

    update(isWarningActive) {
        const now = this.audioContext.currentTime;
        const mix = AUDIO_MIX.warning;

        if (isWarningActive) {
            const gate = Math.sin(now * Math.PI * 2 * mix.gateRate) > 0 ? 1 : 0;
            const targetGain = gate * mix.gateGain;
            this.warningGain.gain.setTargetAtTime(targetGain, now, mix.gainOnSmoothing);

            this.oscA.frequency.setTargetAtTime(mix.oscABase + gate * mix.oscAGateScale, now, mix.frequencySmoothing);
            this.oscB.frequency.setTargetAtTime(mix.oscBBase + gate * mix.oscBGateScale, now, mix.frequencySmoothing);
        } else {
            this.warningGain.gain.setTargetAtTime(0, now, mix.gainOffSmoothing);
        }
    }

    dispose() {
        this.oscA.stop();
        this.oscB.stop();
        this.outputGain.disconnect();
    }
}
