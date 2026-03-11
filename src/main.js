import { GameState } from './GameState.js';
import { IntroScreen } from './ui/IntroScreen.js';
import { DebugOverlay } from './ui/DebugOverlay.js';
import { MapView } from './ui/MapView.js';
import { PauseMenu } from './ui/PauseMenu.js';
import { CrashScreen } from './ui/CrashScreen.js';
import { SaveState } from './utils/SaveState.js';
import { WorldGenerator } from './world/WorldGenerator.js';
import { TerrainManager } from './world/TerrainManager.js';
import { WaterManager } from './world/WaterManager.js';
import { WorldBoundary } from './world/WorldBoundary.js';
import { AircraftManager } from './aircraft/AircraftManager.js';
import { AirportManager } from './airport/AirportManager.js';
import { CameraManager } from './camera/CameraManager.js';
import { InputManager } from './core/InputManager.js';
import { PhysicsEngine } from './physics/PhysicsEngine.js';
import { InstrumentPanel } from './instruments/InstrumentPanel.js';
import { AudioManager } from './audio/AudioManager.js';

class Game {
    constructor() {
        this.gameState = GameState;
        this.savedData = SaveState.load();
        this.hasSave = !!this.savedData;

        if (Number.isFinite(this.savedData?.seed)) {
            this.gameState.world.seed = this.savedData.seed;
        }
        if (Number.isFinite(this.savedData?.lod)) {
            this.gameState.settings.lod = this.savedData.lod;
        }

        this.gameState.flags.isPaused = true;
        this.gameState.flags.isCrashed = false;
        this.gameState.flags.showMap = false;

        // Three.js setup
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue

        // Camera (Right-handed, Y-up)
        // Set near plane to 1.0 and far to 30000 to improve Z-buffer precision and stop terrain z-fighting
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1.0, 30000);
        this.camera.position.set(0, 10, -20);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(100, 200, 50);
        this.scene.add(dirLight);

        // Core Systems
        this.worldGenerator = new WorldGenerator(this.gameState.world.seed);
        this.gameState.world.seed = this.worldGenerator.baseSeed; // Ensure GameState has exact seed used

        this.terrainManager = new TerrainManager(this.gameState, this.scene, this.worldGenerator);

        this.waterManager = new WaterManager(this.scene);
        this.waterManager.init();

        this.worldBoundary = new WorldBoundary(this.gameState);

        // Airport module (Phase 6) — must be added before aircraft so spawn position is known
        this.airportManager = new AirportManager(this.scene);
        this.spawnTransform = this.airportManager.getSpawnTransform();

        // Start on runway by default. Continue-mode state is applied from intro action.
        this.resetAircraftStateToSpawn();

        this.aircraftManager = new AircraftManager(this.gameState, this.scene);
        this.cameraManager = new CameraManager(this.gameState, this.camera, this.renderer.domElement);

        this.inputManager = new InputManager(this.gameState);
        this.inputManager.onBrakeToggle = (isOn) => {
            this.cameraManager.showMessage(`Wheel Brakes: ${isOn ? 'ON' : 'OFF'}`);
        };
        this.physicsEngine = new PhysicsEngine(this.gameState, this.aircraftManager.aircraftLogic.config);

        // Map view (Phase 6)
        this.mapView = new MapView(this.gameState, this.worldGenerator, this.airportManager);
        this.inputManager.onMapToggle = () => {
            // Only allow map if not crashed and game has started
            if (this.gameState.camera.mode !== 'intro' && !this.gameState.flags.isCrashed) {
                this.mapView.toggle();
            }
        };

        // UI
        this.introScreen = new IntroScreen(this.gameState, {
            hasSave: this.hasSave,
            onStartNew: () => this.startGame('new'),
            onContinue: () => this.startGame('continue'),
            onResetWorld: () => this.resetWorld(),
            onLodChanged: () => this.onLodChanged()
        });
        this.introScreen.init();

        this.pauseMenu = new PauseMenu(this.gameState, {
            onResume: () => {
                this.gameState.flags.isPaused = false;
                this.audioManager.resume();
            },
            onResetFlight: () => this.resetFlightToRunway(),
            onLodChanged: () => this.onLodChanged()
        });
        this.pauseMenu.init();

        this.crashScreen = new CrashScreen(() => this.resetFlightToRunway());
        this.crashScreen.init();

        this.debugOverlay = new DebugOverlay(this.gameState);
        this.debugOverlay.init();

        this.instrumentPanel = new InstrumentPanel(this.gameState);
        this.audioManager = new AudioManager(this.gameState);

        if (this.gameState.settings.devMode) {
            window.gameState = this.gameState;
        }

        // Game Loop timing
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.physicsTickRate = 1 / 60; // 60Hz
        this.autoSaveInterval = 8; // seconds
        this.autoSaveAccumulator = 0;
        this.wasPausedLastFrame = this.gameState.flags.isPaused;

        // FPS tracking
        this.frames = 0;
        this.lastFpsTime = performance.now();
        this.fps = 0;

        // Bindings
        this.animate = this.animate.bind(this);
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('beforeunload', () => {
            this.saveGameState();
        });
    }

    startGame(mode = 'new') {
        if (this.mapView.isOpen) {
            this.mapView.close();
        }

        if (mode === 'continue' && this.savedData) {
            this.applySavedState(this.savedData);
        } else {
            this.resetAircraftStateToSpawn();
        }

        this.introScreen.hide();

        this.gameState.flags.isPaused = false;
        this.gameState.flags.isCrashed = false;
        this.gameState.flags.showMap = false;

        this.pauseMenu.hide();
        this.crashScreen.hide();

        this.audioManager.init();
        this.audioManager.resume();

        // Spec: simulation starts in cockpit view
        this.cameraManager.setMode('cockpit', false);

        this.lastTime = performance.now();
        this.accumulator = 0;
        this.autoSaveAccumulator = 0;
        this.wasPausedLastFrame = false;

        this.aircraftManager.writeState();
        this.saveGameState();
    }

    physicsTick(dt) {
        // Run input before physics
        this.inputManager.update(dt);

        // Run core physics loop at fixed timestep
        this.physicsEngine.update(dt);
    }

    animate(currentTime) {
        try {
            requestAnimationFrame(this.animate);

            const frameTime = (currentTime - this.lastTime) / 1000; // in seconds
            this.lastTime = currentTime;

            this.audioManager.update(frameTime);

            // Intro mode: keep scene static until player chooses Start/Continue
            if (this.gameState.camera.mode === 'intro') {
                this.pauseMenu.hide();
                this.crashScreen.hide();
                this.renderer.render(this.scene, this.camera);
                return;
            }

            this.handlePauseTransition();

            if (this.gameState.flags.isCrashed) {
                this.pauseMenu.hide();
                this.crashScreen.show();
                // Stop physics and movement when crashed, but keep rendering the static scene
                this.renderer.render(this.scene, this.camera);
                return;
            }

            this.crashScreen.hide();

            if (this.gameState.flags.isPaused && this.gameState.camera.mode !== 'intro') {
                if (this.gameState.flags.showMap) {
                    this.pauseMenu.hide();
                } else {
                    this.pauseMenu.show();
                }

                // Still render the scene if paused, but no physics updates
                this.renderer.render(this.scene, this.camera);
                return;
            }

            // Hide pause overlay when running
            this.pauseMenu.hide();

            // Cap frameTime to prevent spiral of death if tab is inactive
            this.accumulator += Math.min(frameTime, 0.1);

            // Fixed timestep physics loop
            while (this.accumulator >= this.physicsTickRate) {
                this.physicsTick(this.physicsTickRate);
                this.accumulator -= this.physicsTickRate;
            }

            // Update Managers
            this.aircraftManager.update(frameTime);
            this.cameraManager.update(frameTime);

            this.terrainManager.update();
            this.waterManager.update(frameTime);
            this.worldBoundary.update(frameTime);

            // Render loop
            this.renderer.render(this.scene, this.camera);

            // Update instrument panel (only draws in cockpit mode)
            this.instrumentPanel.update();

            // Periodic autosave while actively simulating
            this.autoSaveAccumulator += frameTime;
            if (this.autoSaveAccumulator >= this.autoSaveInterval) {
                this.saveGameState();
                this.autoSaveAccumulator = 0;
            }

            // Update UI/Debug (using real physics data now)
            this.frames++;
            if (currentTime - this.lastFpsTime >= 1000) {
                this.fps = this.frames;
                this.frames = 0;
                this.lastFpsTime = currentTime;
            }

            this.debugOverlay.update(
                this.fps,
                this.gameState.world.terrainHeight || 0,
                this.gameState.world.activeChunks || 0,
                this.gameState.aircraft.airspeed * 1.94384, // m/s to knots
                this.gameState.aircraft.verticalSpeed * 196.85, // m/s to fpm
                this.gameState.aircraft.lift || 0 // Newns
            );
        } catch (e) {
            console.error("FATAL ERROR IN ANIMATE LOOP:", e);
            if (!this.hasLoggedError) {
                document.getElementById('ui-layer').innerHTML += `<div style="position:absolute;top:50px;left:50px;color:red;background:black;padding:20px;z-index:9999;">${e.stack}</div>`;
                this.hasLoggedError = true;
            }
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onLodChanged() {
        this.terrainManager.rebuildAll();
        this.saveGameState();
    }

    handlePauseTransition() {
        if (this.wasPausedLastFrame === this.gameState.flags.isPaused) return;

        const justPaused = this.gameState.flags.isPaused;
        if (justPaused && !this.gameState.flags.showMap && !this.gameState.flags.isCrashed) {
            this.saveGameState();
        }

        this.wasPausedLastFrame = this.gameState.flags.isPaused;
    }

    saveGameState() {
        if (this.gameState.camera.mode === 'intro') return;
        if (this.gameState.flags.isCrashed) return;

        SaveState.save(this.gameState);
        this.savedData = SaveState.load();
        this.hasSave = true;
        this.introScreen.setHasSave(true);
    }

    resetWorld() {
        SaveState.clear();
        window.location.reload();
    }

    resetFlightToRunway() {
        if (this.mapView.isOpen) {
            this.mapView.close();
        }

        this.resetAircraftStateToSpawn();

        this.gameState.flags.isCrashed = false;
        this.gameState.flags.isPaused = false;
        this.gameState.flags.showMap = false;

        this.crashScreen.hide();
        this.pauseMenu.hide();

        this.cameraManager.setMode('cockpit', false);
        this.audioManager.resume();

        this.lastTime = performance.now();
        this.accumulator = 0;
        this.autoSaveAccumulator = 0;
        this.wasPausedLastFrame = false;

        this.aircraftManager.writeState();
        this.saveGameState();
    }

    resetAircraftStateToSpawn() {
        const spawn = this.spawnTransform || this.airportManager.getSpawnTransform();

        const aircraft = this.gameState.aircraft;
        aircraft.position = { x: spawn.x, y: spawn.y, z: spawn.z };
        aircraft.rotation = { pitch: 0, yaw: 0, roll: 0 };
        aircraft.velocity = { x: 0, y: 0, z: 0 };
        aircraft.acceleration = { x: 0, y: 0, z: 0 };
        aircraft.heading = spawn.heading;
        aircraft.altitude = spawn.y;
        aircraft.airspeed = 0;
        aircraft.verticalSpeed = 0;
        aircraft.turnRate = 0;
        aircraft.slip = 0;
        aircraft.aoa = 0;
        aircraft.engineRunning = false;
        aircraft.throttle = 0;
        aircraft.rpm = 0;
        aircraft.lift = 0;

        this.gameState.flags.isStalled = false;
        this.gameState.flags.stallWarning = false;

        if (this.worldGenerator) {
            this.gameState.world.terrainHeight = this.worldGenerator.getHeightAt(aircraft.position.x, aircraft.position.z);
        }

        if (this.inputManager) {
            this.inputManager.resetTransientState(false);
        } else {
            this.gameState.controls.pitch = 0;
            this.gameState.controls.roll = 0;
            this.gameState.controls.yaw = 0;
            this.gameState.controls.throttle = 0;
            this.gameState.controls.wheelBrake = false;
        }
    }

    applySavedState(data) {
        if (!data || !data.position) return;

        const spawn = this.spawnTransform || this.airportManager.getSpawnTransform();
        const aircraft = this.gameState.aircraft;

        aircraft.position = {
            x: Number.isFinite(data.position.x) ? data.position.x : spawn.x,
            y: Number.isFinite(data.position.y) ? data.position.y : spawn.y,
            z: Number.isFinite(data.position.z) ? data.position.z : spawn.z
        };

        aircraft.rotation = {
            pitch: Number.isFinite(data.rotation?.pitch) ? data.rotation.pitch : 0,
            yaw: 0,
            roll: Number.isFinite(data.rotation?.roll) ? data.rotation.roll : 0
        };

        aircraft.velocity = { x: 0, y: 0, z: 0 };
        aircraft.acceleration = { x: 0, y: 0, z: 0 };
        aircraft.heading = Number.isFinite(data.heading) ? data.heading : spawn.heading;
        aircraft.altitude = Number.isFinite(data.altitude) ? data.altitude : aircraft.position.y;
        aircraft.airspeed = 0;
        aircraft.verticalSpeed = 0;
        aircraft.turnRate = 0;
        aircraft.slip = 0;
        aircraft.aoa = 0;
        aircraft.engineRunning = !!data.engineRunning;

        const throttle = Number.isFinite(data.throttle) ? Math.max(0, Math.min(1, data.throttle)) : 0;
        aircraft.throttle = throttle;
        this.inputManager.resetTransientState(true);
        this.gameState.controls.throttle = throttle;
        aircraft.rpm = aircraft.engineRunning ? this.aircraftManager.aircraftLogic.config.idleRpm : 0;
        aircraft.lift = 0;

        this.gameState.flags.isStalled = false;
        this.gameState.flags.stallWarning = false;

        if (this.worldGenerator) {
            this.gameState.world.terrainHeight = this.worldGenerator.getHeightAt(aircraft.position.x, aircraft.position.z);
        }
    }
}

// Ensure ThreeJS is loaded from CDN before starting
window.onload = () => {
    if (typeof THREE !== 'undefined') {
        const game = new Game();
        requestAnimationFrame(game.animate);
    } else {
        console.error("Three.js failed to load!");
        document.getElementById('ui-layer').innerHTML = '<div style="color:red; background:black; padding:20px;">Error: Three.js failed to load. Check console or internet connection.</div>';
    }
};
