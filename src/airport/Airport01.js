/**
 * Airport01.js
 * The initial airport — "Copilot Field" (ZCPF).
 * A single 1800m north–south runway situated at world origin on flat terrain.
 * Runway 36 departs northward (–Z); 18 departs southward (+Z).
 */
import { AirportBase } from './AirportBase.js';
import { RunwayBuilder } from './RunwayBuilder.js';

export class Airport01 extends AirportBase {
    constructor() {
        super();

        this.name = 'Copilot Field';
        this.icao = 'ZCPF';

        // Airport reference point sits at world origin, 10m MSL (matches WorldGenerator.baseAltitude)
        this.position = { x: 0, y: 10, z: 0 };

        // Runway runs north–south, aligned with Z axis
        this.runwayHeading = 0;   // Runway 36 = northbound takeoff (true heading 360/0°)
        this.runwayLength  = 1800; // metres
        this.runwayWidth   = 30;   // metres
    }

    /**
     * Build and return the Three.js Group for the entire airport.
     * @returns {THREE.Group}
     */
    build() {
        const group = new THREE.Group();

        // ---- Runway ----
        const runway = RunwayBuilder.build({
            length : this.runwayLength,
            width  : this.runwayWidth
        });
        group.add(runway);

        // ---- Apron / stand area (north end) ----
        const apronGeo = new THREE.PlaneGeometry(80, 80);
        const apronMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const apron = new THREE.Mesh(apronGeo, apronMat);
        apron.rotation.x = -Math.PI / 2;
        apron.position.set(-55, 0.01, -this.runwayLength / 2 - 40);
        group.add(apron);

        // ---- Taxiway connecting apron to runway north threshold ----
        const taxiGeo = new THREE.PlaneGeometry(10, 60);
        const taxiMat = new THREE.MeshLambertMaterial({ color: 0x2e2e2e });
        const taxi = new THREE.Mesh(taxiGeo, taxiMat);
        taxi.rotation.x = -Math.PI / 2;
        taxi.position.set(-20, 0.01, -this.runwayLength / 2 - 15);
        group.add(taxi);

        // ---- Main hangar building ----
        const hangar = Airport01._buildHangar();
        hangar.position.set(-65, 0, -this.runwayLength / 2 - 40);
        group.add(hangar);

        // ---- Small terminal / control tower ----
        const tower = Airport01._buildTower();
        tower.position.set(-45, 0, -this.runwayLength / 2 - 60);
        group.add(tower);

        // ---- Windsock ----
        const windsock = Airport01._buildWindsock();
        windsock.position.set(35, 0, -this.runwayLength / 2 + 50);
        group.add(windsock);

        // Position the whole airport group at the reference elevation
        group.position.set(this.position.x, this.position.y, this.position.z);

        return group;
    }

    /**
     * Return the aircraft spawn transform: south threshold, heading north.
     * @returns {{ x: number, y: number, z: number, heading: number }}
     */
    getSpawnTransform() {
        return {
            x       : 0,
            y       : this.position.y,         // 10m MSL — matching flat terrain
            z       : this.runwayLength / 2 - 50, // 50m in from the south threshold
            heading : 0                          // Heading 0 = north = –Z
        };
    }

    // ------------------------------------------------------------------
    //  Private helpers for building structures
    // ------------------------------------------------------------------

    static _buildHangar() {
        const g = new THREE.Group();

        // Walls (box)
        const bodyGeo = new THREE.BoxGeometry(30, 8, 20);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x7a7a7a });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 4;
        g.add(body);

        // Roof (pitched, using a box squashed and rotated)
        const roofGeo = new THREE.BoxGeometry(32, 3, 22);
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x555566 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 9.5;
        g.add(roof);

        // Hangar door frame (slightly different colour)
        const doorGeo = new THREE.PlaneGeometry(14, 8);
        const doorMat = new THREE.MeshLambertMaterial({
            color: 0x4a4a5a,
            side: THREE.FrontSide
        });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(0, 4, 10.05);
        g.add(door);

        return g;
    }

    static _buildTower() {
        const g = new THREE.Group();

        // Tower shaft
        const shaftGeo = new THREE.BoxGeometry(5, 18, 5);
        const shaftMat = new THREE.MeshLambertMaterial({ color: 0xbbbbbb });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.position.y = 9;
        g.add(shaft);

        // Cab (wider box at top)
        const cabGeo = new THREE.BoxGeometry(8, 4, 8);
        const cabMat = new THREE.MeshLambertMaterial({ color: 0xddddcc });
        const cab = new THREE.Mesh(cabGeo, cabMat);
        cab.position.y = 20;
        g.add(cab);

        // Cab windows (dark blue planes on each face)
        const winMat = new THREE.MeshLambertMaterial({ color: 0x3366aa });
        [[0, 0, 4.05], [0, 0, -4.05], [4.05, 0, 0], [-4.05, 0, 0]].forEach(([x, , z]) => {
            const winGeo = new THREE.PlaneGeometry(6, 2.5);
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(x, 20, z);
            if (z !== 0) win.rotation.y = z > 0 ? 0 : Math.PI;
            else win.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2;
            g.add(win);
        });

        // Small terminal building at base
        const termGeo = new THREE.BoxGeometry(15, 5, 10);
        const termMat = new THREE.MeshLambertMaterial({ color: 0xccccbb });
        const term = new THREE.Mesh(termGeo, termMat);
        term.position.set(-10, 2.5, 0);
        g.add(term);

        return g;
    }

    static _buildWindsock() {
        const g = new THREE.Group();

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 5, 6);
        const poleMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2.5;
        g.add(pole);

        // Sock (orange cone)
        const sockGeo = new THREE.ConeGeometry(0.4, 1.5, 8, 1, true);
        const sockMat = new THREE.MeshLambertMaterial({
            color: 0xff6600,
            side: THREE.DoubleSide
        });
        const sock = new THREE.Mesh(sockGeo, sockMat);
        sock.rotation.z = Math.PI / 2;  // point horizontally
        sock.position.set(0.75, 5.2, 0);
        g.add(sock);

        return g;
    }
}
