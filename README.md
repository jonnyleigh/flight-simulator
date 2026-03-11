# JavaScript Flight Simulator

A single-player, in-browser flight simulator built with Three.js. Physics, audio, and all assets are generated entirely in code — no external files required.

## Features

- Cessna 172-based aircraft built from Three.js primitives
- Realistic-feeling flight physics with lift, drag, thrust, ground effect, and stall behaviour
- Procedurally generated 256×256 km world with terrain, hills, and water bodies
- Analogue six-pack instrument panel (cockpit view)
- Two camera modes: in-cockpit and chase
- Procedural audio via the Web Audio API (engine, wind, stall warning, ground rumble)
- Map view with pan and zoom
- Save state via `localStorage`
- Configurable LOD presets (Low / Medium / High)

## Controls

| Key | Action |
|-----|--------|
| W / S | Pitch down / up |
| A / D | Roll left / right |
| Q / E | Yaw left / right |
| R / F | Throttle up / down |
| B | Wheel brake |
| G | Engine start / stop |
| M | Toggle map view |
| P | Pause |
| 1 / 2 | Cockpit / chase camera |

Pitch, roll, and yaw controls spring-return to centre on release.

## Running the Simulator

No build tools or bundlers are required. The project runs directly in the browser as ES6 modules and must be served over HTTP (not opened as a `file://` URL).

### Option 1 — Live Web Hosting

You can access the flight simulator here: INSERT URL WHEN CREATED


### Option 2 — Local PowerShell script

```powershell
.\serve.ps1
```

Then open `http://localhost:8080` in your browser.

### Option 3 — Python

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Project Structure

```
index.html              Entry point
src/
  main.js               Bootstrap — creates systems and starts the game loop
  GameState.js          Shared state object passed to all systems
  aircraft/             Aircraft base class, Cessna 172 config, 3D model, manager
  physics/              60Hz physics engine and flight model
  world/                Procedural terrain, water, LOD, and world boundary
  airport/              Modular airport system with runway builder
  camera/               Cockpit and chase cameras with mouse-look
  instruments/          Analogue instrument panel rendered to Canvas
  audio/                Web Audio API engine, wind, warning, and ambient sounds
  ui/                   Intro screen, pause menu, crash screen, map view, settings
  utils/                Unit conversions, save state, maths helpers, event bus
```

## Architecture Notes

- **Coordinate system:** right-handed, Y-up, world units in metres
- **Physics:** fixed 60Hz tick decoupled from the render loop
- **Units:** internal physics in m/s and metres; instruments display in knots, feet, and fpm
- **Modules:** ES6 `import`/`export`, one responsibility per file
- **State:** single `GameState` object passed by reference to all systems
- **Audio:** Web Audio API only — no sound files
- **Assets:** Three.js primitives only — no model or texture files

## Browser Requirements

A modern browser with support for ES6 modules and the Web Audio API (Chrome, Firefox, Edge, Safari 15+).
