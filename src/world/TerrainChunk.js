export class TerrainChunk {
    constructor(chunkX, chunkZ, lodSettings, worldGenerator) {
        this.chunkX = chunkX;
        this.chunkZ = chunkZ;
        this.size = lodSettings.chunkSize;
        this.segments = lodSettings.segments;
        this.generator = worldGenerator;

        this.mesh = null;

        // Center world coordinates of this chunk
        this.worldX = this.chunkX * this.size;
        this.worldZ = this.chunkZ * this.size;
    }

    build() {
        // Create plane geometry
        // PlaneGeometry arguments: width, height, widthSegments, heightSegments
        const geometry = new THREE.PlaneGeometry(
            this.size,
            this.size,
            this.segments,
            this.segments
        );

        // Rotate to lie flat on XZ plane
        geometry.rotateX(-Math.PI / 2);

        // Displace vertices based on world generator
        const posAttribute = geometry.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // The vertex coordinates are relative to the center of the chunk
            const globalX = this.worldX + vertex.x;
            const globalZ = this.worldZ + vertex.z;

            // Generate height
            const height = this.generator.getHeightAt(globalX, globalZ);

            // Set the Y position to the generated height
            posAttribute.setY(i, height);
        }

        // Recompute normals for proper lighting
        geometry.computeVertexNormals();

        // Create standard material
        // We can color based on height later using shaders, but for Phase 2 
        // we'll use vertex colors or just a simple standard material.

        // Let's add vertex coloring based on height
        const colors = [];
        for (let i = 0; i < posAttribute.count; i++) {
            const h = posAttribute.getY(i);
            const color = this.getColorForHeight(h);
            colors.push(color.r, color.g, color.b);
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8, // Terrain isn't very shiny
            metalness: 0.1
        });

        this.mesh = new THREE.Mesh(geometry, material);

        // Position the chunk mesh in the world
        this.mesh.position.set(this.worldX, 0, this.worldZ);

        return this.mesh;
    }

    getColorForHeight(height) {
        const color = new THREE.Color();

        if (height < 0) {
            // Submerged shelf / underwater terrain tint (visible through water transparency)
            color.setHex(0x5f7e8a);
        } else if (height < 8) {
            // Narrow beach band
            color.setHex(0xdacd9f);
        } else if (height < 180) {
            // Grass / Plains
            color.setHex(0x3e7a3e);
        } else if (height < 420) {
            // Hills / uplands
            color.setHex(0x2d5a27);
        } else if (height < 600) {
            // Rock / Mountains
            color.setHex(0x7c858e);
        } else {
            // Snow peaks
            color.setHex(0xffffff);
        }

        return color;
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            // Note: We don't remove it from the scene here, the TerrainManager handles that
            this.mesh = null;
        }
    }
}
