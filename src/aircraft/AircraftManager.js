import { Cessna172 } from './Cessna172.js';
import { AircraftModel } from './AircraftModel.js';

export class AircraftManager {
    constructor(gameState, scene) {
        this.gameState = gameState;
        this.scene = scene;

        // In the future this could load different aircraft, but spec says hardcode Cessna for now
        this.aircraftLogic = new Cessna172();
        this.aircraftModel = new AircraftModel();

        // A container for the entire aircraft system to easily move it through the world
        this.container = new THREE.Group();
        this.container.add(this.aircraftModel.mesh);

        this.scene.add(this.container);

        // Set initial positions based on saved state or defaults
        this.readState();
    }

    readState() {
        const state = this.gameState.aircraft;
        this.container.position.set(state.position.x, state.position.y, state.position.z);

        // Apply rotation (Three.js uses Euler angles, default order is XYZ)
        // Note: Aircraft headings are usually Y-axis rotations
        this.container.rotation.set(state.rotation.pitch, -state.heading, state.rotation.roll, 'YXZ');
    }

    writeState() {
        // In Phase 3, this is mostly 1:1, but in Phase 4 the PhysicsEngine will write to GameState,
        // and this manager will only read from it.
        // For testing Phase 3 standalone, we need to sync container to GameState or vice versa.
        // Actually, we'll let GameState drive the position.

        const state = this.gameState.aircraft;
        this.container.position.set(state.position.x, state.position.y, state.position.z);
        this.container.rotation.set(state.rotation.pitch, -state.heading, state.rotation.roll, 'YXZ');
    }

    update(dt) {
        // Phase 3: No physics. Just reading position from GameState and drawing.
        this.writeState();

        // Toggle cockpit/exterior visibility based on camera mode
        const isCockpit = this.gameState.camera.mode === 'cockpit';
        this.aircraftModel.setCockpitMode(isCockpit);

        // Update visual model (e.g., spin prop)
        // For phase 3 test, just fake RPM based on engine running state
        let visualRPM = 0;
        if (this.gameState.aircraft.engineRunning) {
            visualRPM = 2000;
        }
        this.aircraftModel.update(dt, this.gameState.aircraft.engineRunning, visualRPM);
    }
}
