/**
 * GameState.js
 * Single shared state object. Holds aircraft state, world state, input state, camera mode, 
 * pause/crash flags. Passed by reference to all systems.
 */
export const GameState = {
    // Aircraft State
    aircraft: {
        position: { x: 0, y: 0, z: 0 }, // Right-handed, Y-up. internally in metres
        rotation: { pitch: 0, yaw: 0, roll: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        acceleration: { x: 0, y: 0, z: 0 },
        heading: 0,
        altitude: 0,
        airspeed: 0, // internally in m/s
        verticalSpeed: 0, // internally in m/s
        turnRate: 0,
        slip: 0,
        aoa: 0, // angle of attack
        engineRunning: false,
        throttle: 0,
        rpm: 0,
        lift: 0
    },

    // Input Control State
    controls: {
        pitch: 0, // -1 to +1
        roll: 0,  // -1 to +1
        yaw: 0,   // -1 to +1
        throttle: 0, // 0 to 1
        wheelBrake: false
    },

    // World properties
    world: {
        seed: 0,
        terrainHeight: 0,
        activeChunks: 0
    },

    // UI and state flags
    flags: {
        isPaused: false,
        isCrashed: false,
        isStalled: false,
        stallWarning: false,
        showMap: false
    },

    // Camera
    camera: {
        mode: 'intro' // 'intro', 'cockpit', 'chase'
    },

    // Settings
    settings: {
        lod: 1, // 0: Low, 1: Medium, 2: High
        devMode: true
    }
};
