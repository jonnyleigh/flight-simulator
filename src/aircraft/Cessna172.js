import { AircraftBase } from './AircraftBase.js';

export class Cessna172 extends AircraftBase {
    constructor() {
        super();

        // Phase 4 Physics configurations (stubbed for now)
        this.config = {
            name: "Cessna 172 Skyhawk",
            mass: 1111, // kg (max takeoff weight ~2450 lbs)
            wingArea: 16.2, // m^2
            wingSpan: 11.0, // m

            // Aerodynamics (rough approximations for a game-feel)
            clMax: 1.5,
            stallSpeedKnots: 55,

            // Engine
            maxPower: 120000, // Watts (~160 HP)
            maxRpm: 2700,
            idleRpm: 800,
        };
    }
}
