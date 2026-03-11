import { GameState } from '../GameState.js';

export const SaveState = {
    saveKey: 'flightsim_save',

    save(state = GameState) {
        const throttle = state.controls?.throttle ?? state.aircraft?.throttle ?? 0;
        const data = {
            seed: state.world.seed,
            position: state.aircraft.position,
            rotation: state.aircraft.rotation,
            heading: state.aircraft.heading,
            altitude: state.aircraft.altitude,
            engineRunning: state.aircraft.engineRunning,
            throttle,
            lod: state.settings?.lod ?? 1
        };
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(data));
            console.log("Game state saved.");
        } catch (e) {
            console.warn("Failed to save state to localStorage", e);
        }
    },

    load() {
        try {
            const dataStr = localStorage.getItem(this.saveKey);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                if (!data || typeof data !== 'object') return null;
                return data;
            }
        } catch (e) {
            console.warn("Failed to load state from localStorage", e);
        }
        return null;
    },

    hasSave() {
        return !!this.load();
    },

    clear() {
        try {
            localStorage.removeItem(this.saveKey);
            console.log("Game state cleared.");
        } catch (e) {
            console.warn("Failed to clear state from localStorage", e);
        }
    }
};
