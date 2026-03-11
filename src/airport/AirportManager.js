/**
 * AirportManager.js
 * Loads and manages all airports. Adds their geometry to the scene and
 * provides a canonical spawn transform for the initial aircraft placement.
 * New airports can be added to the AIRPORT_REGISTRY array in the future.
 */
import { Airport01 } from './Airport01.js';

/** Registry of all available airports. Add new airports here. */
const AIRPORT_REGISTRY = [
    Airport01
];

export class AirportManager {
    /**
     * @param {object} scene - The Three.js scene
     */
    constructor(scene) {
        this.scene = scene;

        /** @type {AirportBase[]} */
        this.airports = [];

        this._loadAirports();
    }

    /** Instantiate, build, and add all airports to the scene. */
    _loadAirports() {
        for (const AirportClass of AIRPORT_REGISTRY) {
            const airport = new AirportClass();
            const group = airport.build();
            this.scene.add(group);
            this.airports.push(airport);
            console.log(`[AirportManager] Loaded airport: ${airport.name} (${airport.icao})`);
        }
    }

    /**
     * Return the spawn transform for the first airport (default spawn location).
     * @returns {{ x: number, y: number, z: number, heading: number }}
     */
    getSpawnTransform() {
        if (this.airports.length === 0) {
            console.warn('[AirportManager] No airports loaded, using world origin.');
            return { x: 0, y: 10, z: 0, heading: 0 };
        }
        return this.airports[0].getSpawnTransform();
    }

    /**
     * Return all loaded airport instances (used by the map view to draw icons).
     * @returns {AirportBase[]}
     */
    getAirports() {
        return this.airports;
    }
}
