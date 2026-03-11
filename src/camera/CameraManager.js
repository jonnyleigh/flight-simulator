import { ChaseCamera } from './ChaseCamera.js';
import { CockpitCamera } from './CockpitCamera.js';

export class CameraManager {
    constructor(gameState, camera, domElement) {
        this.gameState = gameState;
        this.camera = camera;
        this.domElement = domElement;

        this.modes = {
            chase: new ChaseCamera(camera, gameState, domElement),
            cockpit: new CockpitCamera(camera, gameState, domElement)
        };

        this.currentMode = null;

        // Setup toggle keys
        window.addEventListener('keydown', (e) => {
            // Ignore if paused or typing in debug overlay
            if (this.gameState.flags.isPaused || e.target.tagName === 'INPUT') return;

            if (e.code === 'Digit1') {
                this.setMode('cockpit', true);
            } else if (e.code === 'Digit2') {
                this.setMode('chase', true);
            }
        });
    }

    showMessage(text) {
        let msgEl = document.getElementById('camera-message');
        if (!msgEl) {
            msgEl = document.createElement('div');
            msgEl.id = 'camera-message';
            msgEl.style.position = 'absolute';
            msgEl.style.top = '10%';
            msgEl.style.left = '50%';
            msgEl.style.transform = 'translateX(-50%)';
            msgEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
            msgEl.style.color = '#fff';
            msgEl.style.padding = '10px 20px';
            msgEl.style.borderRadius = '5px';
            msgEl.style.fontFamily = 'sans-serif';
            msgEl.style.fontSize = '1.2rem';
            msgEl.style.pointerEvents = 'none';
            msgEl.style.zIndex = '300';
            msgEl.style.transition = 'opacity 0.5s';
            const container = document.getElementById('ui-layer') || document.body;
            container.appendChild(msgEl);
        }
        msgEl.innerText = text;
        msgEl.style.opacity = '1';

        if (this.messageTimeout) {
            clearTimeout(this.messageTimeout);
        }
        this.messageTimeout = setTimeout(() => {
            msgEl.style.opacity = '0';
        }, 2000);
    }

    setMode(modeString, showText = true) {
        if (this.currentMode === this.modes[modeString]) return;

        if (this.currentMode) {
            this.currentMode.deactivate();
        }

        if (this.modes[modeString]) {
            this.currentMode = this.modes[modeString];
            this.currentMode.activate();
            this.gameState.camera.mode = modeString;

            if (showText) {
                this.showMessage(`Switching to ${modeString} view`);
            }
        } else {
            console.warn(`Camera mode ${modeString} not found.`);
        }
    }

    update(dt) {
        // Ensure state aligns (e.g., set initially from main.js when game starts)
        const stateMode = this.gameState.camera.mode;

        // If mode is 'intro', don't update internal cameras, just wait for game start
        if (stateMode === 'intro') {
            return;
        }

        // If state changed outside manager, update it.
        if (this.currentMode !== this.modes[stateMode]) {
            this.setMode(stateMode, false);
        }

        // Update active camera
        if (this.currentMode) {
            this.currentMode.update(dt);
        }
    }
}
