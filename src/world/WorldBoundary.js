export class WorldBoundary {
    constructor(gameState) {
        this.gameState = gameState;
        // World is 256x256km -> radius is 128km
        this.maxRadius = 128000;
        this.repulsionZone = 5000; // Begin repulsion 5km before boundary
    }

    update(dt) {
        const pos = this.gameState.aircraft.position;
        const distFromCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

        if (distFromCenter > this.maxRadius - this.repulsionZone) {
            // Player is approaching or has exceeded the boundary
            const overflow = distFromCenter - (this.maxRadius - this.repulsionZone);

            // Calculate direction back to center (normalized)
            const dirX = -pos.x / distFromCenter;
            const dirZ = -pos.z / distFromCenter;

            // Apply simple push-back force/velocity. 
            // The further over the line, the stronger the push.
            // Since phase 2 has no flight physics yet, we just hard-clamp or nudge the position.

            if (distFromCenter > this.maxRadius) {
                // Hard clamp if outside maximum radius
                pos.x = -dirX * this.maxRadius * -1;
                pos.z = -dirZ * this.maxRadius * -1;
            } else {
                // In phase 4 we will apply true physical forces here. 
                // For now, in dev mode teleport testing, this acts as a hard wall.
            }
        }
    }
}
