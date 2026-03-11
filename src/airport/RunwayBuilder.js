/**
 * RunwayBuilder.js
 * Builds Three.js runway geometry: tarmac surface, centreline markings,
 * threshold markings, edge lines, and landing lights.
 * All geometry is returned as a THREE.Group positioned at local origin.
 */
export class RunwayBuilder {
    /**
     * Build complete runway geometry.
     * @param {object} config
     * @param {number} config.length  - Runway length in metres (default 1800)
     * @param {number} config.width   - Runway width in metres (default 30)
     * @returns {THREE.Group}  Runway group centred at local origin, running along Z axis.
     *                         +Z end is the departure threshold, -Z end is the arrival threshold.
     */
    static build({ length = 1800, width = 30 } = {}) {
        const group = new THREE.Group();

        // --- Tarmac surface ---
        const tarmacGeo = new THREE.PlaneGeometry(width, length);
        const tarmacMat = new THREE.MeshLambertMaterial({
            color: 0x2a2a2a,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const tarmac = new THREE.Mesh(tarmacGeo, tarmacMat);
        tarmac.rotation.x = -Math.PI / 2;
        tarmac.receiveShadow = true;
        // Lift 5 cm above the terrain level to prevent z-fighting
        tarmac.position.y = 0.05;
        group.add(tarmac);

        // --- Edge lines (white stripes 0.5m wide along each side) ---
        const edgeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

        [-1, 1].forEach(side => {
            const edgeGeo = new THREE.PlaneGeometry(0.5, length);
            const edge = new THREE.Mesh(edgeGeo, edgeMat);
            edge.rotation.x = -Math.PI / 2;
            edge.position.set((width / 2 - 0.25) * side, 0.08, 0);
            group.add(edge);
        });

        // --- Centreline dashes (15m dash, 15m gap) ---
        const dashMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const dashLength = 15;
        const dashGap = 15;
        const dashInterval = dashLength + dashGap;
        const numDashes = Math.floor(length / dashInterval);
        const startZ = -(Math.floor(numDashes / 2) * dashInterval);

        for (let i = 0; i < numDashes; i++) {
            const dashGeo = new THREE.PlaneGeometry(0.5, dashLength);
            const dash = new THREE.Mesh(dashGeo, dashMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(0, 0.08, startZ + i * dashInterval + dashLength / 2);
            group.add(dash);
        }

        // --- Threshold markings (at each end, 8 white stripes across width) ---
        RunwayBuilder._addThresholdMarkings(group, length, width);

        // --- Touchdown zone markings (pairs of rectangles either side of centreline) ---
        RunwayBuilder._addTouchdownZoneMarkings(group, length, width);

        // --- Landing light stakes along both sides ---
        RunwayBuilder._addLandingLights(group, length, width);

        return group;
    }

    /**
     * Add threshold stripe markings at each runway end.
     */
    static _addThresholdMarkings(group, length, width) {
        const stripeW = (width - 4) / 9;  // 8 stripes with 1m gaps across usable width
        const stripeLen = 30; // 30m long
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });

        [-1, 1].forEach(end => {
            const baseZ = end * (length / 2 - stripeLen / 2 - 2);
            for (let i = -4; i <= 4; i++) {
                if (i === 0) continue; // Skip centre gap
                const geo = new THREE.PlaneGeometry(stripeW - 0.3, stripeLen);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.rotation.x = -Math.PI / 2;
                mesh.position.set(i * (stripeW + 0.2), 0.08, baseZ);
                group.add(mesh);
            }
        });
    }

    /**
     * Add touchdown zone markers (pairs of bars) inboard of threshold markings.
     */
    static _addTouchdownZoneMarkings(group, length, width) {
        const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const barW = (width * 0.3);
        const barH = 6;
        const offsets = [50, 100, 150]; // distance from threshold

        [-1, 1].forEach(end => {
            offsets.forEach(offset => {
                [-1, 1].forEach(side => {
                    const geo = new THREE.PlaneGeometry(barW, barH);
                    const mesh = new THREE.Mesh(geo, mat);
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.position.set(side * (width / 4 + barW / 4), 0.08,
                        end * (length / 2 - offset));
                    group.add(mesh);
                });
            });
        });
    }

    /**
     * Add landing light bollards along the runway edges.
     */
    static _addLandingLights(group, length, width) {
        const lightSpacing = 60; // every 60m
        const numLights = Math.floor(length / lightSpacing);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });

        for (let i = 0; i <= numLights; i++) {
            const z = -length / 2 + i * lightSpacing;

            [-1, 1].forEach(side => {
                const x = side * (width / 2 + 1.5);

                // Post
                const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 4);
                const pole = new THREE.Mesh(poleGeo, poleMat);
                pole.position.set(x, 0.3, z);
                group.add(pole);

                // Light bulb
                const lightGeo = new THREE.SphereGeometry(0.18, 5, 4);
                const light = new THREE.Mesh(lightGeo, lightMat);
                light.position.set(x, 0.65, z);
                group.add(light);
            });
        }

        // Approach end lights (red): mark the arrival threshold
        const redMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
        for (let i = -5; i <= 5; i++) {
            const geo = new THREE.SphereGeometry(0.2, 5, 4);
            const mesh = new THREE.Mesh(geo, redMat);
            mesh.position.set(i * 2.5, 0.4, -length / 2 - 3);
            group.add(mesh);
        }

        // Departure end lights (green): mark the departure threshold
        const greenMat = new THREE.MeshBasicMaterial({ color: 0x00cc44 });
        for (let i = -5; i <= 5; i++) {
            const geo = new THREE.SphereGeometry(0.2, 5, 4);
            const mesh = new THREE.Mesh(geo, greenMat);
            mesh.position.set(i * 2.5, 0.4, length / 2 + 3);
            group.add(mesh);
        }
    }
}
