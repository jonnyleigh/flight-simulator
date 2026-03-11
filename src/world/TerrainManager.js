import { TerrainChunk } from './TerrainChunk.js';
import { getLODSettings } from './LODSettings.js';

export class TerrainManager {
    constructor(gameState, scene, worldGenerator) {
        this.gameState = gameState;
        this.scene = scene;
        this.generator = worldGenerator;

        this.chunks = new Map(); // Key: 'x,z', Value: TerrainChunk
        this.lodSettings = getLODSettings(this.gameState);

        this.lastChunkX = null;
        this.lastChunkZ = null;
    }

    update() {
        // Check current LOD settings (may have been changed in UI)
        const currentLOD = getLODSettings(this.gameState);
        if (currentLOD !== this.lodSettings) {
            this.lodSettings = currentLOD;
            this.rebuildAll();
        }

        const pos = this.gameState.aircraft.position;
        const chunkSize = this.lodSettings.chunkSize;

        // Find which chunk the player is currently in
        const currentChunkX = Math.round(pos.x / chunkSize);
        const currentChunkZ = Math.round(pos.z / chunkSize);

        // Update GameState telemetry
        const terrainHeight = this.generator.getHeightAt(pos.x, pos.z);
        this.gameState.world.terrainHeight = terrainHeight;

        // If player moved to a new chunk (or first run), update loaded chunks
        if (currentChunkX !== this.lastChunkX || currentChunkZ !== this.lastChunkZ) {
            this.updateChunks(currentChunkX, currentChunkZ);
            this.lastChunkX = currentChunkX;
            this.lastChunkZ = currentChunkZ;
        }
    }

    updateChunks(centerChunkX, centerChunkZ) {
        const radius = this.lodSettings.drawDistance;
        const chunksToKeep = new Set();

        // Load chunks within radius
        for (let x = -radius; x <= radius; x++) {
            for (let z = -radius; z <= radius; z++) {
                // Circular draw distance
                if (x * x + z * z > radius * radius) continue;

                const chunkX = centerChunkX + x;
                const chunkZ = centerChunkZ + z;
                const key = `${chunkX},${chunkZ}`;
                chunksToKeep.add(key);

                if (!this.chunks.has(key)) {
                    this.loadChunk(chunkX, chunkZ, key);
                }
            }
        }

        // Unload chunks out of radius
        for (const [key, chunk] of this.chunks.entries()) {
            if (!chunksToKeep.has(key)) {
                this.unloadChunk(key, chunk);
            }
        }

        this.gameState.world.activeChunks = this.chunks.size;
    }

    loadChunk(x, z, key) {
        const chunk = new TerrainChunk(x, z, this.lodSettings, this.generator);
        const mesh = chunk.build();
        this.scene.add(mesh);
        this.chunks.set(key, chunk);
    }

    unloadChunk(key, chunk) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
        this.chunks.delete(key);
    }

    rebuildAll() {
        // Force a rebuild of all chunks (e.g., if LOD changed)
        for (const [key, chunk] of this.chunks.entries()) {
            this.unloadChunk(key, chunk);
        }
        this.chunks.clear();
        this.lastChunkX = null; // Forces updateChunks on next update
    }
}
