import { AUDIO_MIX } from './AudioMixConstants.js';

export class EngineAudio {
    constructor(audioContext, outputNode) {
        this.audioContext = audioContext;
        const mix = AUDIO_MIX.engine;
        const drone = mix.drone;
        const combustion = mix.combustion;
        const texture = mix.texture;
        const starter = mix.starter;

        this.outputGain = this.audioContext.createGain();
        this.outputGain.gain.value = mix.outputGain;
        this.outputGain.connect(outputNode);

        // Main engine drone
        this.droneFilter = this.audioContext.createBiquadFilter();
        this.droneFilter.type = 'lowpass';
        this.droneFilter.frequency.value = drone.initialFilterFrequency;
        this.droneFilter.Q.value = drone.filterQ;

        this.droneGain = this.audioContext.createGain();
        this.droneGain.gain.value = 0;

        this.combustionGain = this.audioContext.createGain();
        this.combustionGain.gain.value = combustion.baseGain;

        this.combustionDepth = this.audioContext.createGain();
        this.combustionDepth.gain.value = 0;

        this.combustionLfo = this.audioContext.createOscillator();
        this.combustionLfo.type = 'square';
        this.combustionLfo.frequency.value = (mix.rpm.idle / 60) * combustion.firingEventsPerRev;

        this.droneOscA = this.audioContext.createOscillator();
        this.droneOscA.type = 'sawtooth';
        this.droneOscA.frequency.value = drone.oscAInitialFrequency;

        this.droneOscB = this.audioContext.createOscillator();
        this.droneOscB.type = 'triangle';
        this.droneOscB.frequency.value = drone.oscBInitialFrequency;

        this.droneOscA.connect(this.droneFilter);
        this.droneOscB.connect(this.droneFilter);
        this.droneFilter.connect(this.combustionGain);
        this.combustionGain.connect(this.droneGain);
        this.droneGain.connect(this.outputGain);

        this.combustionLfo.connect(this.combustionDepth);
        this.combustionDepth.connect(this.combustionGain.gain);

        this.droneOscA.start();
        this.droneOscB.start();
        this.combustionLfo.start();

        // Engine texture branch (intake/exhaust noise)
        const textureNoiseBuffer = this.audioContext.createBuffer(
            1,
            this.audioContext.sampleRate * texture.noiseBufferSeconds,
            this.audioContext.sampleRate
        );
        const textureData = textureNoiseBuffer.getChannelData(0);
        for (let i = 0; i < textureData.length; i++) {
            textureData[i] = Math.random() * 2 - 1;
        }

        this.textureNoiseSource = this.audioContext.createBufferSource();
        this.textureNoiseSource.buffer = textureNoiseBuffer;
        this.textureNoiseSource.loop = true;

        this.textureFilter = this.audioContext.createBiquadFilter();
        this.textureFilter.type = 'bandpass';
        this.textureFilter.frequency.value = texture.filterFrequencyBase;
        this.textureFilter.Q.value = texture.filterQ;

        this.textureGain = this.audioContext.createGain();
        this.textureGain.gain.value = 0;

        this.textureNoiseSource.connect(this.textureFilter);
        this.textureFilter.connect(this.textureGain);
        this.textureGain.connect(this.outputGain);
        this.textureNoiseSource.start();

        // Starter/cranking stutter branch
        this.starterFilter = this.audioContext.createBiquadFilter();
        this.starterFilter.type = 'bandpass';
        this.starterFilter.frequency.value = starter.filterFrequency;
        this.starterFilter.Q.value = starter.filterQ;

        this.starterGain = this.audioContext.createGain();
        this.starterGain.gain.value = 0;

        this.starterOscA = this.audioContext.createOscillator();
        this.starterOscA.type = 'square';
        this.starterOscA.frequency.value = starter.oscAInitialFrequency;

        this.starterOscB = this.audioContext.createOscillator();
        this.starterOscB.type = 'sawtooth';
        this.starterOscB.frequency.value = starter.oscBInitialFrequency;

        this.starterOscA.connect(this.starterFilter);
        this.starterOscB.connect(this.starterFilter);
        this.starterFilter.connect(this.starterGain);
        this.starterGain.connect(this.outputGain);

        this.starterOscA.start();
        this.starterOscB.start();

        this.lastEngineRunning = false;
        this.startProgress = 0;
        this.startDuration = starter.startDuration;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    update(dt, engineRunning, throttleNorm, rpm) {
        const now = this.audioContext.currentTime;
        const mix = AUDIO_MIX.engine;
        const drone = mix.drone;
        const combustion = mix.combustion;
        const texture = mix.texture;
        const starter = mix.starter;

        if (engineRunning && !this.lastEngineRunning) {
            this.startProgress = 0.0001;
        }

        if (!engineRunning && this.lastEngineRunning) {
            this.startProgress = 0;
            this.starterGain.gain.cancelScheduledValues(now);
            this.starterGain.gain.setTargetAtTime(0, now, starter.shutdownSmoothing);
            this.droneGain.gain.cancelScheduledValues(now);
            this.droneGain.gain.setTargetAtTime(0, now, drone.gainFallTime);
            this.textureGain.gain.cancelScheduledValues(now);
            this.textureGain.gain.setTargetAtTime(0, now, texture.gainSmoothing);
            this.combustionDepth.gain.cancelScheduledValues(now);
            this.combustionDepth.gain.setTargetAtTime(0, now, combustion.gainSmoothing);
        }

        this.lastEngineRunning = engineRunning;

        const throttle = this.clamp(throttleNorm ?? 0, 0, 1);
        const currentRpm = this.clamp(rpm ?? mix.rpm.idle, mix.rpm.idle, mix.rpm.idle + mix.rpm.range);
        const rpmNorm = this.clamp((currentRpm - mix.rpm.idle) / mix.rpm.range, 0, 1);

        if (engineRunning) {
            if (this.startProgress > 0 && this.startProgress < this.startDuration) {
                this.startProgress += dt;
                const progress = this.clamp(this.startProgress / this.startDuration, 0, 1);

                const pulse = Math.max(0, Math.sin(now * Math.PI * 2 * (starter.pulseBaseRate + progress * starter.pulseProgressRateScale)));
                const stutterAmount = (1 - progress) * starter.stutterGainScale * pulse;

                this.starterOscA.frequency.setTargetAtTime(
                    starter.oscABaseFrequency + progress * starter.oscAProgressScale + pulse * starter.oscAPulseScale,
                    now,
                    starter.oscASmoothing
                );
                this.starterOscB.frequency.setTargetAtTime(
                    starter.oscBBaseFrequency + progress * starter.oscBProgressScale,
                    now,
                    starter.oscBSmoothing
                );
                this.starterGain.gain.setTargetAtTime(stutterAmount, now, starter.stutterSmoothing);

                const startupBlend = this.clamp((progress - starter.startupBlendStart) / starter.startupBlendSpan, 0, 1);
                const startupDroneGain = (
                    drone.gainStartupBase +
                    drone.gainStartupThrottleScale * throttle +
                    drone.gainStartupRpmScale * rpmNorm
                ) * startupBlend;
                this.droneGain.gain.setTargetAtTime(startupDroneGain, now, drone.gainRiseTime);
            } else {
                this.startProgress = this.startDuration;
                this.starterGain.gain.setTargetAtTime(0, now, starter.stopSmoothing);

                const runningGain =
                    drone.gainRunningBase +
                    throttle * drone.gainRunningThrottleScale +
                    rpmNorm * drone.gainRunningRpmScale;
                this.droneGain.gain.setTargetAtTime(runningGain, now, drone.gainRiseTime);
            }

            const baseFrequency =
                drone.baseFrequency +
                throttle * drone.throttleFrequencyScale +
                rpmNorm * drone.rpmFrequencyScale;
            this.droneOscA.frequency.setTargetAtTime(baseFrequency, now, drone.frequencySmoothing);
            this.droneOscB.frequency.setTargetAtTime(baseFrequency * drone.harmonicRatio, now, drone.frequencySmoothing);
            this.droneFilter.frequency.setTargetAtTime(
                drone.filterBase +
                throttle * drone.filterThrottleScale +
                rpmNorm * drone.filterRpmScale,
                now,
                drone.filterSmoothing
            );

            const firingHz = (currentRpm / 60) * combustion.firingEventsPerRev;
            this.combustionLfo.frequency.setTargetAtTime(firingHz, now, combustion.frequencySmoothing);

            const combustionBaseGain = combustion.baseGain + throttle * combustion.baseThrottleScale;
            const combustionDepthGain =
                combustion.depthBase +
                throttle * combustion.depthThrottleScale +
                rpmNorm * combustion.depthRpmScale;
            this.combustionGain.gain.setTargetAtTime(combustionBaseGain, now, combustion.gainSmoothing);
            this.combustionDepth.gain.setTargetAtTime(combustionDepthGain, now, combustion.gainSmoothing);

            const textureGain =
                texture.gainBase +
                throttle * texture.gainThrottleScale +
                rpmNorm * texture.gainRpmScale;
            this.textureGain.gain.setTargetAtTime(textureGain, now, texture.gainSmoothing);
            this.textureFilter.frequency.setTargetAtTime(
                texture.filterFrequencyBase +
                throttle * texture.filterThrottleScale +
                rpmNorm * texture.filterRpmScale,
                now,
                texture.filterSmoothing
            );
        } else {
            this.starterGain.gain.setTargetAtTime(0, now, starter.idleSmoothing);
            this.textureGain.gain.setTargetAtTime(0, now, texture.gainSmoothing);
            this.combustionDepth.gain.setTargetAtTime(0, now, combustion.gainSmoothing);
            this.combustionGain.gain.setTargetAtTime(combustion.baseGain, now, combustion.gainSmoothing);
        }
    }

    dispose() {
        this.droneOscA.stop();
        this.droneOscB.stop();
        this.combustionLfo.stop();
        this.textureNoiseSource.stop();
        this.starterOscA.stop();
        this.starterOscB.stop();
        this.outputGain.disconnect();
    }
}
