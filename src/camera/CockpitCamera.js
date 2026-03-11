export class CockpitCamera {
    constructor(camera, gameState, domElement) {
        this.camera = camera;
        this.gameState = gameState;
        this.domElement = domElement;

        // Settings based on Cessna 172 model
        // mesh.position.y=1.45 baked offset; cabin is now 1.2m tall, centred at model y=0.6
        // cabin floor ≈ model y=0, ceiling ≈ model y=1.2 → world y = state.y + 1.45 + 1.2 = state.y + 2.65
        // Eye at ~60% cabin height → model y ≈ 0.72 → world offset = 1.45 + 0.72 ≈ 2.17
        this.cockpitOffset = new THREE.Vector3(0, 2.1, -0.5); // Pilot eye height inside cabin

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
        // Interior geometry is within ~0.1–1 m of the camera, so use a small near plane.
        // Store the original so we can restore it on deactivate.
        this._savedNear = this.camera.near;
        this.camera.near = 0.05;
        this.camera.updateProjectionMatrix();

        this.domElement.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
    }

    deactivate() {
        // Restore the original near plane for chase/exterior views.
        if (this._savedNear !== undefined) {
            this.camera.near = this._savedNear;
            this.camera.updateProjectionMatrix();
        }

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
            this.dragOffsetXY.x += e.movementX * 0.005; // Drag right looks right
            this.dragOffsetXY.y -= e.movementY * 0.005; // Drag up looks up

            // Clamp pitch look angle to +/- 80 degrees
            this.dragOffsetXY.y = Math.max(-Math.PI / 2 + 0.2, Math.min(Math.PI / 2 - 0.2, this.dragOffsetXY.y));
            // Clamp yaw to +/- 160 degrees
            this.dragOffsetXY.x = Math.max(-Math.PI + 0.5, Math.min(Math.PI - 0.5, this.dragOffsetXY.x));

            this.lastDragTime = performance.now();
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.isDragging = false;
        }
    }

    update(dt) {
        const state = this.gameState.aircraft;

        // Position camera inside cockpit
        // Apply aircraft rotation to offset
        const euler = new THREE.Euler(state.rotation.pitch, -state.heading, state.rotation.roll, 'YXZ');
        const offset = this.cockpitOffset.clone().applyEuler(euler);

        this.camera.position.set(
            state.position.x + offset.x,
            state.position.y + offset.y,
            state.position.z + offset.z
        );

        // Auto-return mouse look
        if (!this.isDragging && performance.now() - this.lastDragTime > this.autoReturnDelay) {
            // Lerp back to center
            this.dragOffsetXY.x *= Math.pow(0.5, dt * 10);
            this.dragOffsetXY.y *= Math.pow(0.5, dt * 10);
        }

        // Build the aircraft's base orientation quaternion.
        // Body frame: -Z is forward (same as Three.js camera default), so Euler(pitch, -heading, roll)
        // makes the camera look through the nose.
        const baseQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(state.rotation.pitch, -state.heading, state.rotation.roll, 'YXZ')
        );

        // Build the look-offset quaternion in the aircraft's LOCAL space
        // (yaw first, then pitch, no roll — 'YXZ' order)
        const lookOffsetQuat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(this.dragOffsetXY.y, this.dragOffsetXY.x, 0, 'YXZ')
        );

        // Combine: aircraft orientation * local look offset
        this.camera.quaternion.copy(baseQuat).multiply(lookOffsetQuat);
    }
}
