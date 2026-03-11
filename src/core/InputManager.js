export class InputManager {
    constructor(gameState) {
        this.gameState = gameState;

        // Track raw key states
        this.keys = {};

        // Settings for axes
        this.controlSpeed = 2.0; // How fast standard controls move to 1.0 or -1.0
        this.autoCenterSpeed = 1.0; // How fast standard controls spring back to 0
        this.throttleSpeed = 0.5; // Throttle doesn't auto-center

        // Bind event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
    }

    onKeyDown(e) {
        // Ignore if typing in debug input
        if (e.target.tagName === 'INPUT') return;

        // Ignore gameplay input before start and after crash
        if (this.gameState.camera.mode === 'intro' || this.gameState.flags.isCrashed) return;

        this.keys[e.code] = true;

        if (e.repeat) return;

        // Toggles
        if (e.code === 'KeyP') {
            // Don't toggle pause while map is open — map manages pause state itself
            if (!this.gameState.flags.showMap) {
                this.gameState.flags.isPaused = !this.gameState.flags.isPaused;
            }
        }
        if (e.code === 'KeyG') {
            this.gameState.aircraft.engineRunning = !this.gameState.aircraft.engineRunning;
        }
        if (e.code === 'KeyB') {
            this.gameState.controls.wheelBrake = !this.gameState.controls.wheelBrake;
            if (this.onBrakeToggle) {
                this.onBrakeToggle(this.gameState.controls.wheelBrake);
            }
        }
        if (e.code === 'KeyM') {
            if (this.onMapToggle) {
                this.onMapToggle();
            }
        }
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    update(dt) {
        if (this.gameState.flags.isPaused) return;

        const controls = this.gameState.controls;

        // PITCH (W/S or Up/Down)
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            controls.pitch += this.controlSpeed * dt;
        } else if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            controls.pitch -= this.controlSpeed * dt;
        } else {
            // Auto-center
            if (controls.pitch > 0) controls.pitch = Math.max(0, controls.pitch - this.autoCenterSpeed * dt);
            if (controls.pitch < 0) controls.pitch = Math.min(0, controls.pitch + this.autoCenterSpeed * dt);
        }

        // ROLL (A/D or Left/Right)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            controls.roll += this.controlSpeed * dt;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            controls.roll -= this.controlSpeed * dt;
        } else {
            // Auto-center
            if (controls.roll > 0) controls.roll = Math.max(0, controls.roll - this.autoCenterSpeed * dt);
            if (controls.roll < 0) controls.roll = Math.min(0, controls.roll + this.autoCenterSpeed * dt);
        }

        // YAW (Q/E)
        if (this.keys['KeyQ']) {
            controls.yaw += this.controlSpeed * dt;
        } else if (this.keys['KeyE']) {
            controls.yaw -= this.controlSpeed * dt;
        } else {
            // Auto-center
            if (controls.yaw > 0) controls.yaw = Math.max(0, controls.yaw - this.autoCenterSpeed * dt);
            if (controls.yaw < 0) controls.yaw = Math.min(0, controls.yaw + this.autoCenterSpeed * dt);
        }

        // THROTTLE (R/F)
        if (this.keys['KeyR']) {
            controls.throttle += this.throttleSpeed * dt;
        } else if (this.keys['KeyF']) {
            controls.throttle -= this.throttleSpeed * dt;
        }

        // Clamp values
        controls.pitch = Math.max(-1, Math.min(1, controls.pitch));
        controls.roll = Math.max(-1, Math.min(1, controls.roll));
        controls.yaw = Math.max(-1, Math.min(1, controls.yaw));
        controls.throttle = Math.max(0, Math.min(1, controls.throttle));
    }

    resetTransientState(preserveThrottle = false) {
        this.keys = {};

        const controls = this.gameState.controls;
        controls.pitch = 0;
        controls.roll = 0;
        controls.yaw = 0;
        controls.wheelBrake = false;

        if (!preserveThrottle) {
            controls.throttle = 0;
        }
    }
}
