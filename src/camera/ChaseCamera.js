export class ChaseCamera {
    constructor(camera, gameState, domElement) {
        this.camera = camera;
        this.gameState = gameState;
        this.domElement = domElement;

        // Physics logic target (we read from GameState, but having a target vector helps)
        this.target = new THREE.Vector3();
        this.currentPosition = new THREE.Vector3();

        // Settings
        this.distance = 15;     // Behind aircraft
        this.height = 4;        // Above aircraft
        this.smoothness = 5;    // Spring factor

        // Mouse Look state
        this.isDragging = false;
        this.dragOffsetXY = { x: 0, y: 0 };
        this.lastDragTime = 0;
        this.autoReturnDelay = 3000; // ms

        // Bind event listeners
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
    }

    activate() {
        this.domElement.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);

        // Snap to immediately on activation
        this.update(0.1, true);
    }

    deactivate() {
        this.domElement.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.isDragging = false;
        this.dragOffsetXY = { x: 0, y: 0 };
    }

    onMouseDown(e) {
        if (e.button === 0) { // Left click
            this.isDragging = true;
            this.lastDragTime = performance.now();
        }
    }

    onMouseMove(e) {
        if (this.isDragging) {
            this.dragOffsetXY.x -= e.movementX * 0.01;
            this.dragOffsetXY.y += e.movementY * 0.01;

            // Clamp pitch look angle
            this.dragOffsetXY.y = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.dragOffsetXY.y));

            this.lastDragTime = performance.now();
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isDragging = false;
        }
    }

    update(dt, immediate = false) {
        const state = this.gameState.aircraft;
        this.target.set(state.position.x, state.position.y, state.position.z);

        // Auto-return mouse look
        if (!this.isDragging && performance.now() - this.lastDragTime > this.autoReturnDelay) {
            // Lerp back to center
            this.dragOffsetXY.x *= Math.pow(0.5, dt * 10);
            this.dragOffsetXY.y *= Math.pow(0.5, dt * 10);
        }

        // Base heading (Y-axis rotation) of aircraft
        const heading = state.heading;

        // Calculate ideal position
        // We want to be `distance` behind the aircraft, based on its heading.
        // We also add the mouse drag offset to look around.
        const yaw = heading + this.dragOffsetXY.x;
        const pitchOffset = this.dragOffsetXY.y;

        const offsetX = Math.sin(-yaw) * this.distance * Math.cos(pitchOffset);
        const offsetZ = Math.cos(-yaw) * this.distance * Math.cos(pitchOffset);
        const offsetY = Math.sin(pitchOffset) * this.distance + this.height;

        const idealPosition = new THREE.Vector3(
            this.target.x + offsetX,
            this.target.y + offsetY,
            this.target.z + offsetZ
        );

        if (immediate) {
            this.currentPosition.copy(idealPosition);
        } else {
            // Smoothly interpolate current position to ideal position
            // Disabled spring lerping here to prevent 'shaky' visuals 
            // caused by decoupling the renderer's 144Hz dt from the 60Hz physics ticks
            this.currentPosition.copy(idealPosition);
        }

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.target);
    }
}
