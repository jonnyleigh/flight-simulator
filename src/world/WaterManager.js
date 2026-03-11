export class WaterManager {
    constructor(scene) {
        this.scene = scene;
        this.waterMesh = null;
        this.waterLevel = 0; // MSL
        // Keep water clearly below near-sea-level land to avoid lowland depth flicker.
        this.visualDepthBias = -0.30;
    }

    init() {
        // Since we have a bounded world (256x256km), we can just create one enormous
        // low-poly plane for the water rather than chunking it, which is much cheaper.
        const worldSize = 256000;

        const geometry = new THREE.PlaneGeometry(worldSize, worldSize, 1, 1);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshStandardMaterial({
            color: 0x1ca3ec,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1, // Shiny water
            metalness: 0.5,
            depthWrite: false,
            // Push water depth slightly away from the camera to stop blue bleed on lowlands.
            polygonOffset: true,
            polygonOffsetFactor: 1,
            polygonOffsetUnits: 2
        });

        this.waterMesh = new THREE.Mesh(geometry, material);
        this.waterMesh.position.y = this.waterLevel + this.visualDepthBias;

        this.scene.add(this.waterMesh);
    }

    update(dt) {
        // Phase 2: Water is static. Could animate UVs here later.
    }
}
