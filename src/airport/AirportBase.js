/**
 * AirportBase.js
 * Abstract base class for all airports.
 * Defines the interface that all airport implementations must follow.
 */
export class AirportBase {
    constructor() {
        if (new.target === AirportBase) {
            throw new Error('AirportBase is abstract and cannot be instantiated directly.');
        }

        /**
         * World position of the airport reference point (centre of runway threshold).
         * @type {{ x: number, y: number, z: number }}
         */
        this.position = { x: 0, y: 0, z: 0 };

        /**
         * Runway heading in degrees (0 = north / -Z axis, clockwise).
         * @type {number}
         */
        this.runwayHeading = 0;

        /**
         * Runway length in metres.
         * @type {number}
         */
        this.runwayLength = 1800;

        /**
         * Runway width in metres.
         * @type {number}
         */
        this.runwayWidth = 30;

        /**
         * Human-readable name for the airport.
         * @type {string}
         */
        this.name = 'Unknown Airport';

        /**
         * ICAO-style identifier.
         * @type {string}
         */
        this.icao = 'ZZZZ';
    }

    /**
     * Build and return the Three.js Group representing the airport geometry.
     * Must be overridden by subclasses.
     * @returns {THREE.Group}
     */
    build() {
        throw new Error('build() must be implemented by subclass.');
    }

    /**
     * Returns the aircraft spawn position on the runway threshold (in metres).
     * Aircraft spawns at the start of the runway, facing takeoff direction.
     * @returns {{ x: number, y: number, z: number, heading: number }}
     */
    getSpawnTransform() {
        throw new Error('getSpawnTransform() must be implemented by subclass.');
    }
}
