**JavaScript Flight Simulator**

_Phased Build Plan & Module Structure_

For use with GitHub Copilot / AI code generation

# **How to Use This Document**

Feed this document alongside the main specification prompt to GitHub Copilot at the start of each session. It defines the architecture, build order, and file responsibilities so that Copilot generates consistent, interoperable code across all sessions.

Build phases strictly in order - each phase has defined inputs and outputs. Do not ask Copilot to build Phase 3 components before Phase 2 is working.

# **Key Architectural Decisions**

These decisions must be maintained consistently across all files and sessions:

- 3D Library: Three.js (r134+) loaded via CDN
- **Right-handed, Y-up. World units are metres internally.**Coordinate system:
- **Fixed 60Hz, decoupled from render loop using accumulated delta time.**Physics tick rate:
- **Internal physics in metres/m·s⁻¹/degrees. Display in knots/feet/fpm.**Units:
- **ES6 modules (import/export). One responsibility per file.**Module system:
- **A single shared GameState object passed by reference to all systems.**State management:
- **localStorage for save state and world seed.**Persistence:
- **Web Audio API only - no external files.**Audio:
- **No external files. All geometry built from Three.js primitives.**Assets:

# **Phased Build Plan**

There are 8 phases. Each phase should be fully working and testable before moving to the next.

**Phase 1: Project Scaffold & Game Loop**

_Get something rendering in the browser_

Goal: A Three.js scene renders in the browser with a basic game loop running. Nothing flies yet.

**Deliverables**

- index.html entry point with Three.js loaded via CDN
- Game loop running at fixed 60Hz physics tick, separate render loop
- Empty scene with a ground plane, basic lighting, and a camera
- GameState object instantiated and accessible to all modules
- Intro screen UI with Start button (non-functional placeholder)

**Test:**

Open index.html. A grey ground plane is visible. Browser console shows physics tick running at ~60Hz.

**Phase 2: Terrain & World Generation**

_Build the world_

Goal: Procedural terrain generates from a seed and is stored. The world looks like landscape from above.

**Deliverables**

- Chunk-based terrain system with simplex/perlin noise
- Terrain generates hills, plains, and flat areas
- Water bodies rendered as flat blue planes at sea level
- World seed generated and stored in localStorage
- LOD presets (Low/Medium/High) affecting chunk density and draw distance
- Airport area forced flat in the terrain generator
- World boundary at 256×256km with invisible barrier logic

**Test:**

World generates consistently from the same seed. Flying (manually set position) across the world shows varying terrain and water.

**Phase 3: Aircraft Model & Basic Camera**

_Put a plane in the world_

Goal: A recognisable Cessna-like model sits on the runway. Camera modes work.

**Deliverables**

- Cessna 172 model built from Three.js primitives (fuselage, high wing, tail, propeller, undercarriage)
- Aircraft positioned at airport runway start
- Chase camera (follows behind/above aircraft)
- Cockpit camera (positioned at pilot eye point)
- Mouse look: view rotates with mouse drag, auto-returns to default after 3 seconds
- Camera mode toggle on keys 1/2

**Test:**

Plane visible on runway. Both camera modes work. Mouse look snaps back after release.

**Phase 4: Flight Physics**

_Make it fly_

Goal: The aircraft flies with realistic-feeling (not necessarily sim-accurate) physics.

**Deliverables**

- Keyboard controls: W/S pitch, A/D roll, Q/E yaw - all spring-return to centre on release
- Throttle: R/F gradual increase/decrease
- Lift, drag, thrust, and gravity forces applied each physics tick
- Angle of attack calculated from velocity vector vs aircraft orientation
- Ground effect: lift multiplier increases below 1× wingspan altitude
- Stall: triggers at &lt;55 knots or &gt;17° AoA - nose pitches down, lift collapses
- Stall warning activates 5 knots before stall speed
- Wheel brake on B key (ground only)
- Engine start/stop on G key with start-sequence delay
- Crash detection: impact with terrain or water triggers crash state

**Test:**

Aircraft takes off with full throttle and held W. Stall recoverable by pushing nose down. Crash on hitting ground triggers message.

**Phase 5: Flight Instruments & Cockpit UI**

_Build the instrument panel_

Goal: All six-pack instruments plus secondary instruments render and update in real time.

**Deliverables**

- Airspeed Indicator (analogue dial, 0-200 knots)
- Attitude Indicator (artificial horizon ball)
- Altimeter (dual-needle dial, feet)
- Turn Coordinator (aircraft symbol + ball)
- Heading Indicator (rotating compass rose)
- Vertical Speed Indicator (±2000 fpm)
- Throttle position gauge
- Aileron / Elevator / Rudder position indicator
- Engine on/off indicator light
- Stall warning indicator light
- All instruments rendered as HTML Canvas overlaid on the 3D view (not 3D objects)
- Instruments only visible in cockpit camera mode

**Test:**

All instruments respond correctly during a flight. Switching to chase mode hides instruments.

**Phase 6: Airport & Map View**

_Navigation features_

Goal: The airport renders properly. Map view shows the world.

**Deliverables**

- Airport module: runway drawn as tarmac with centreline markings and landing lights
- Airport positioned on flat terrain, heading aligned with prevailing direction
- Map view: pauses sim, shows 2D top-down world with terrain colours
- Map scrollable (drag) and zoomable (scroll wheel)
- Aircraft position shown as icon on map
- Airport shown on map
- M key toggles map, simulation resumes on exit

**Test:**

Airport is visible and recognisable. Map opens, shows world, aircraft position updates correctly.

**Phase 7: Audio**

_Add sound_

Goal: All sim sounds generated via Web Audio API. No audio files required.

**Deliverables**

- Engine idle: oscillator-based drone at correct idle pitch
- Engine start sequence: cranking/stuttering effect before engine catches
- Engine running: pitch and volume scale with throttle and RPM
- Engine shutdown: fade out on stop
- Wind: filtered noise, scales with airspeed
- Stall warning: repeating buzzer tone
- Wheel/ground rumble: low-frequency noise on ground, scales with speed
- Audio manager handles all nodes, mutes on pause

**Test:**

All sounds audible and responsive. No sound plays when paused. Engine start sequence plays correctly.

**Phase 8: Menus, Save State & Polish**

_Complete the game loop_

Goal: Full game flow from intro screen to sim to pause to reset works end-to-end.

**Deliverables**

- Intro screen with control reference, Start button, and LOD settings
- Continue from last position vs. reset world options on intro screen
- Save state: persists position, heading, altitude, engine state, throttle, world seed to localStorage
- Pause menu (P key): resume, reset, settings
- Crash screen with reset option
- LOD settings menu accessible from intro and pause screens
- Final performance pass: confirm 60fps at Medium LOD on a mid-range device

**Test:**

Full play session: intro → fly → crash → reset → continue from save. All transitions work correctly.

# **Module & File Structure**

All source files are ES6 modules. index.html is the sole entry point. There are no build tools - the project runs directly in the browser via a local server or Live Server in VS Code.

## **Directory Layout**

/flightsim index.html /src main.js GameState.js /aircraft /physics /world /airport /camera /instruments /audio /ui /utils

## **Core Files**

| **File** | **Responsibility** |
| --- | --- |
| index.html | Entry point. Loads Three.js via CDN. Contains canvas and UI overlay divs. Imports main.js as a module. |
| src/main.js | Bootstrap only. Creates GameState, instantiates all systems, starts the game loop. No logic lives here. |
| src/GameState.js | Single shared state object. Holds aircraft state, world state, input state, camera mode, pause/crash flags. Passed by reference to all systems. |

## **Aircraft Module /src/aircraft/**

| **File** | **Responsibility** |
| --- | --- |
| AircraftBase.js | Abstract base class for all aircraft. Defines the interface (update, reset, getConfig). Never instantiated directly. |
| Cessna172.js | Extends AircraftBase. Defines Cessna 172 config values: mass, wing area, CLmax, stall speed, throttle response curve, etc. |
| AircraftModel.js | Builds the Three.js geometry for the active aircraft. Reads config from aircraft class. Assembles fuselage, wing, tail, undercarriage, propeller. |
| AircraftManager.js | Owns the active aircraft instance. Handles engine start/stop sequence, crash state, and reset. |

## **Physics Module /src/physics/**

| **File** | **Responsibility** |
| --- | --- |
| PhysicsEngine.js | Main physics loop. Runs at 60Hz. Applies forces, integrates velocity and position, detects terrain collision. |
| FlightModel.js | Calculates lift, drag, thrust, and moment forces each tick. Reads aircraft config. Implements stall, ground effect, and AoA. |
| InputHandler.js | Reads keyboard state each frame. Produces a normalised ControlState (pitch/roll/yaw −1 to +1, throttle 0-1). Spring-returns axes to zero on key release. |

## **World Module /src/world/**

| **File** | **Responsibility** |
| --- | --- |
| WorldGenerator.js | Generates terrain from seed using simplex noise. Forces flat area around airport. Stores generated height map in localStorage. |
| TerrainChunk.js | Represents a single terrain tile. Builds Three.js geometry from height map slice. Handles LOD geometry switching. |
| TerrainManager.js | Manages the chunk pool. Loads/unloads chunks around aircraft position. Applies LOD preset. |
| WaterManager.js | Places water planes at sea level for lake/sea areas. Detects water collision. |
| LODSettings.js | Defines Low/Medium/High presets (chunk size, draw distance, polygon density). Exports active preset. |
| WorldBoundary.js | Detects when aircraft approaches world edge. Applies gentle repulsion force. |

## **Airport Module /src/airport/**

| **File** | **Responsibility** |
| --- | --- |
| AirportBase.js | Abstract base class for airports. Defines interface (position, runway heading, build). |
| Airport01.js | The initial airport. Extends AirportBase. Defines position (world centre), runway length/heading. Builds runway geometry. |
| RunwayBuilder.js | Builds runway mesh: tarmac surface, centreline markings, threshold markings, landing lights. |
| AirportManager.js | Loads all airport instances. Provides spawn position for aircraft at startup. |

## **Camera Module /src/camera/**

| **File** | **Responsibility** |
| --- | --- |
| CameraManager.js | Owns the Three.js camera. Switches between modes. Handles mouse-look with auto-return timer. |
| CockpitCamera.js | Positions camera at pilot eye point relative to aircraft transform. Returns to forward after mouse inactivity. |
| ChaseCamera.js | Positions camera above and behind aircraft. Smooth follows with lag. Returns to default after mouse inactivity. |

## **Instruments Module /src/instruments/**

| **File** | **Responsibility** |
| --- | --- |
| InstrumentPanel.js | Orchestrates all instrument renders. Draws to a Canvas overlay element. Only renders in cockpit mode. |
| DialRenderer.js | Shared utility for drawing analogue dials (bezel, scale markings, needle) to Canvas 2D context. |
| AirspeedIndicator.js | Reads airspeed from GameState. Renders analogue dial (knots). |
| AttitudeIndicator.js | Reads pitch/roll. Renders artificial horizon. |
| Altimeter.js | Reads altitude. Renders dual-needle dial (feet). |
| TurnCoordinator.js | Reads turn rate and slip. Renders aircraft symbol and ball. |
| HeadingIndicator.js | Reads heading. Renders rotating compass rose. |
| VSIIndicator.js | Reads vertical speed. Renders ±2000fpm dial. |
| SecondaryInstruments.js | Renders throttle gauge, control surface positions, engine and stall warning lights. |

## **Audio Module /src/audio/**

| **File** | **Responsibility** |
| --- | --- |
| AudioManager.js | Creates and owns the Web Audio API AudioContext. Manages all nodes. Mutes on pause. Provides start/stop methods for each sound. |
| EngineAudio.js | Oscillator-based engine drone. Pitch and gain scale with throttle and RPM. Includes start and shutdown sequences. |
| WindAudio.js | Filtered noise node. Gain scales with airspeed. |
| WarningAudio.js | Stall warning buzzer (repeating tone). |
| AmbientAudio.js | Wheel/ground rumble. Low-frequency noise, gain scales with ground speed. |

## **UI Module /src/ui/**

| **File** | **Responsibility** |
| --- | --- |
| IntroScreen.js | Renders intro screen HTML. Handles Start, Continue, and Reset World buttons. Shows LOD selector. |
| PauseMenu.js | Renders pause overlay. Resume, Reset, Settings options. |
| CrashScreen.js | Renders crash overlay with reset button. |
| MapView.js | Renders 2D world map to a Canvas element. Reads generated terrain. Handles pan/zoom. Shows aircraft and airport icons. |
| HUD.js | Minimal HUD shown in chase mode only (airspeed and altitude readout as text overlay). |
| SettingsMenu.js | LOD preset selector. Accessible from intro and pause screens. |

## **Utils /src/utils/**

| **File** | **Responsibility** |
| --- | --- |
| Units.js | Conversion functions: m/s ↔ knots, metres ↔ feet, m/s ↔ fpm. |
| SaveState.js | Read/write aircraft position, heading, altitude, engine state, throttle, and world seed to localStorage. |
| MathUtils.js | Shared maths helpers: clamp, lerp, angleDiff, simplex noise wrapper. |
| EventBus.js | Simple publish/subscribe event system for loose coupling between modules (e.g. crash event, stall event). |

# **Data Flow Summary**

Understanding how data moves between systems prevents the AI from creating circular dependencies.

InputHandler → ControlState → FlightModel → PhysicsEngine → GameState → (all systems read)

- InputHandler reads raw keyboard state and outputs a normalised ControlState each tick
- FlightModel reads ControlState and aircraft config, outputs force vectors
- PhysicsEngine applies forces to aircraft position/velocity, writes results to GameState
- All rendering and UI systems read from GameState - they never write physics values
- EventBus used for one-time events (crash, stall onset) to avoid polling
- SaveState reads from and writes to GameState on explicit save/load only

# **Tips for Working with GitHub Copilot**

- Start each session by pasting both this document and the spec prompt into the context
- Ask Copilot to implement one file at a time, not one phase at a time
- Always tell Copilot which phase you are currently in
- If Copilot invents a new file not in this structure, redirect it to the correct module
- After each phase, ask Copilot to write a simple browser-console test before moving on
- Keep GameState.js stable - avoid letting Copilot refactor it mid-project
- If a session gets confused, start a new session and re-paste both documents