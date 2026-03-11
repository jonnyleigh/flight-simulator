# Javascript Flightsim AI Prompt
Build a javascript in-browser flight simulator!

This will be a single-player simulator where the physics of flight are simulated in the browser.

The software must be modular to allow multiple aircraft to be flown, but initially only one plane will be available: a single-engined trainer based on the Cessna 172.

To keep things simple there will be no weather or day/night cycle. Clouds will be at a fixed height.

It will use the three.js library.

## Camera Mode
There are two camera modes: in-cockpit and chase mode.

### In-cockpit
The camera is where a pilot would be sitting.  The flight instruments are visible in a virtual cockpit.  The player can use the mouse to rotate the view temporarily, but a few moments after moving the camera it will return to default position.

### Chase mode
The camera flys above and behind the plan.  The player can use the mouse to rotate the view temporarily, but a few moments after moving the camera it will return to default position.
No flight controls are visible.

## Flight Instruments
All flight instruments displyaed are analogue / dials or indicator lights. They are not digital / glass type.

They are:
- Six-pack standard instruments (fully operational):
    - Airspeed Indicator, 
    - Attitude Indicator, 
    - Altimeter, 
    - Turn Coordinator, 
    - Heading Indicator, 
    - Vertical Speed Indicator
- Throttle position
- aileron, elevator and rudder position indicator
- Engine start/stop indicator


## Controls
- W, S: pitch
- A, D: roll
- Q, E: yaw
- R, F: throttle up/down
- B: wheel brake
- G: engine start/stop
- M: map view
- P: pause simulation
- 1, 2: view selector

The pitch and roll controls act like a stick and return to center when the button is released.
The yaw control returns to center when released.

Intially only keyboard input but in the future we may support joystick input.

## Gameplay
When starting an intro screen is displayed with an explanation of the controls. When clicking the start button the simlation starts (full screen). The simulation starts with the plane on the runway, the camera view to in-cockpit.
The user has the option to reset the universe or to continue from last position (stored in browser data)

## Plane 1
Based loosely on a Cessna 172 with overhead high-wing.  
Single engine, fixed pitch etc.

The aircraft model should be built from primitive Three.js geometries (boxes, cylinders, cones) with flat colours — no external model files or textures required. The plane should be recognisable as a high-wing single-engine aircraft from the outside.

## World
The world is procedurally generated but once generated is stored so that it is consistent.
The terrain can be of differing height with realistic flat plains, hills and mountains.
There are also bodies of water as lakes or small seas.
The initial airport should be on flat land with no sourrounding hills.

LOD should be configurable via a settings menu (accessible from the intro/pause screen), with 3 presets: Low, Medium, High. This controls terrain chunk size, draw distance, and polygon density of distant objects. Default to Medium.

The world has a fixed boundary of 256x256 km. The player cannot fly beyond it — a gentle invisible barrier returns the aircraft.

## Airports
Initally there will be a single airport with a single long runway.
The runway is drawn as tarmac with landing lights on it.
The airport system should be modular so that in the future other airports can be added.

## Map view
When entering map view the simulation pauses and a view of the world (as currently generated) is shown. It is scrollable and zoomable.

## Physics and flight model
Include Ground Effect where lift increases near the ground.

If the aircraft impacts terrain or water, a simple crash state is triggered — the simulation freezes, a "crashed" message is displayed, and the player is offered a reset option.

Physics and instruments should use real-world units internally (metres, metres-per-second, degrees). Instruments display in aviation units (knots, feet, fpm).

The physics simulation should run at a fixed tick rate (e.g. 60Hz) decoupled from the render loop.

### Stall behaviour
When the aircraft exceeds its critical angle of attack (approximately 15–18°) or drops below minimum flying speed (~55 knots for the Cessna 172), a stall should occur. The stall should be forgiving and recoverable rather than punishing:

- A stall warning message and a sound activates a few knots before the stall
- On stall, the nose pitches down and the plane loses lift — the player can recover by pushing the nose down and increasing throttle
- Avoid implementing a full spin/autorotation as this would be very difficult to recover from and frustrating for players
- The plane should not be able to maintain level flight below stall speed regardless of throttle

## Audio
All audio is generated procedurally using the Web Audio API — no external sound files are required.

Engine sound: oscillator-based noise whose pitch and intensity scales with throttle position and RPM. On engine start, pitch rises from silence to idle. On shutdown, it fades down.
Wind sound: filtered noise that increases in intensity with airspeed
Stall warning: a repeating tone or buzzer that activates near stall speed
Wheel/ground rumble: low frequency noise when on the ground, scaling with speed
Engine start sequence: a brief stuttering/cranking sound before the engine catches

## Save state
Browser save state should store: aircraft position, heading, altitude, engine state, throttle setting, and the procedural world seed.

# Principals
- Prefer simpler graphics to improve performance
- Flight surfaces should be simulated but not too hard to fly - a mix between a simulator and a game