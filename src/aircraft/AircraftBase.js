export class AircraftBase {
    constructor() {
        if (this.constructor === AircraftBase) {
            throw new Error("Abstract class AircraftBase cannot be instantiated directly.");
        }

        // This will be populated by the derived class
        this.config = {};
    }

    /**
     * Interface methods
     */

    getConfig() {
        return this.config;
    }

    reset(gameState) {
        // Will be implemented in Phase 4 / Physics module
    }

    update(dt, gameState) {
        // Will be implemented in Phase 4 / Physics module
    }
}
