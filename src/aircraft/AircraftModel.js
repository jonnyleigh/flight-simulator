export class AircraftModel {
    constructor() {
        this.mesh = new THREE.Group();
        this.propeller = null;
        this.exteriorGroup = new THREE.Group(); // Parts hidden in cockpit view
        this.cockpitGroup = new THREE.Group(); // Parts only visible in cockpit view

        this.buildModel();
    }

    buildModel() {
        // Materials (Flat colors as per spec)
        const whiteMem = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const redMem = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.5 });
        const darkGrey = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const blackMem = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
        const glassMem = new THREE.MeshStandardMaterial({
            color: 0x88aacc,
            transparent: true,
            opacity: 0.2,
            roughness: 0.05,
            metalness: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        // Interior material — visible from inside the cockpit
        const interiorMem = new THREE.MeshStandardMaterial({
            color: 0x444444, roughness: 0.8, side: THREE.DoubleSide
        });

        // Load real Cessna 172 interior texture for the front wall / control stack
        const interiorTex = new THREE.TextureLoader().load('./assets/172_interior.png');
        interiorTex.colorSpace = THREE.SRGBColorSpace;
        // Flip horizontally so it reads correctly when viewed from inside the cabin
        interiorTex.repeat.set(-1, 1);
        interiorTex.offset.set(1, 0);
        const dashboardMem = new THREE.MeshStandardMaterial({
            map: interiorTex,
            roughness: 0.8,
            side: THREE.DoubleSide
        });

        const interiorRearTex = new THREE.TextureLoader().load('./assets/172_interior_rear.jpg');
        interiorRearTex.colorSpace = THREE.SRGBColorSpace;
        const rearWallMem = new THREE.MeshStandardMaterial({
            map: interiorRearTex,
            roughness: 0.85,
            side: THREE.DoubleSide
        });

        const carpetTex = this.createCarpetTexture();
        const carpetMem = new THREE.MeshStandardMaterial({
            map: carpetTex,
            roughness: 0.97,
            metalness: 0.0,
            side: THREE.DoubleSide
        });

        const seatMem = new THREE.MeshStandardMaterial({
            color: 0xd4cab8,
            roughness: 0.7,
            metalness: 0.0
        });
        const seatDarkMem = new THREE.MeshStandardMaterial({
            color: 0x3a3530,
            roughness: 0.85,
            metalness: 0.0
        });

        const sideWallTex = this.createCreamSideWallTexture();
        const sideWallMem = new THREE.MeshStandardMaterial({
            map: sideWallTex,
            roughness: 0.92,
            metalness: 0.02,
            side: THREE.DoubleSide
        });
        const windowFrameMem = new THREE.MeshStandardMaterial({
            color: 0xe8e1cd,
            roughness: 0.88,
            metalness: 0.02
        });
        const seamStripMem = new THREE.MeshStandardMaterial({
            color: 0xc7b99f,
            roughness: 0.9,
            metalness: 0.01
        });

        // 1. Fuselage (body behind and below the cabin)
        const fuselageGeo = new THREE.BoxGeometry(1.2, 1.4, 6.0);
        const fuselage = new THREE.Mesh(fuselageGeo, whiteMem);
        fuselage.position.set(0, 0, 0);
        // Taper back of fuselage slightly
        const posAttribute = fuselageGeo.attributes.position;
        for (let i = 0; i < posAttribute.count; i++) {
            const z = posAttribute.getZ(i);
            if (z < 0) { // Back half
                posAttribute.setX(i, posAttribute.getX(i) * 0.6);
                posAttribute.setY(i, posAttribute.getY(i) * 0.8);
            }
        }
        fuselageGeo.computeVertexNormals();
        this.exteriorGroup.add(fuselage);

        // 2. Cockpit cabin — built from individual panels
        // Cabin dimensions: width=1.1, height=1.2, depth=2.0
        // Cabin center: (0, 0.6, 0.5) — raised slightly so floor stays near origin
        const cabW = 1.1, cabH = 1.2, cabD = 2.0;
        const cabCX = 0, cabCY = 0.6, cabCZ = 0.5;
        const cabLeft = cabCX - cabW / 2;
        const cabRight = cabCX + cabW / 2;
        const cabBottom = cabCY - cabH / 2;
        const cabTop = cabCY + cabH / 2;
        const cabBack = cabCZ - cabD / 2;
        const cabFront = cabCZ + cabD / 2;

        // Cabin floor — dark carpet
        const floorGeo = new THREE.PlaneGeometry(cabW, cabD);
        const floor = new THREE.Mesh(floorGeo, carpetMem);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(cabCX, cabBottom, cabCZ);
        this.cockpitGroup.add(floor);

        // Seat builder — cream bucket seats visible in cockpit view
        const addSeat = (seatX) => {
            const cushionW = 0.38, cushionD = 0.40, cushionH = 0.11;
            const backW = 0.38, backD = 0.09, backH = 0.52;
            const headrestW = 0.28, headrestD = 0.1, headrestH = 0.18;
            const armW = 0.05, armH = 0.06, armD = 0.28;
            const seatZ = cabCZ - 0.18; // Rear-of-centre of cabin depth

            // Cushion
            const cushion = new THREE.Mesh(
                new THREE.BoxGeometry(cushionW, cushionH, cushionD),
                seatMem
            );
            cushion.position.set(seatX, cabBottom + cushionH / 2, seatZ);
            this.cockpitGroup.add(cushion);

            // Seat back (angled ~12° rearward)
            const seatBack = new THREE.Mesh(
                new THREE.BoxGeometry(backW, backH, backD),
                seatMem
            );
            seatBack.position.set(seatX, cabBottom + cushionH + backH / 2 - 0.02, seatZ - cushionD / 2 + backD / 2);
            seatBack.rotation.x = -0.21; // lean back
            this.cockpitGroup.add(seatBack);

            // Headrest
            const headrest = new THREE.Mesh(
                new THREE.BoxGeometry(headrestW, headrestH, headrestD),
                seatMem
            );
            headrest.position.set(seatX, cabBottom + cushionH + backH + headrestH / 2 - 0.04, seatZ - cushionD / 2 + backD / 2 - 0.04);
            headrest.rotation.x = -0.21;
            this.cockpitGroup.add(headrest);

            // Left armrest
            const leftArm = new THREE.Mesh(
                new THREE.BoxGeometry(armW, armH, armD),
                seatDarkMem
            );
            leftArm.position.set(seatX - cushionW / 2 - armW / 2, cabBottom + cushionH + armH / 2, seatZ);
            this.cockpitGroup.add(leftArm);

            // Right armrest
            const rightArm = new THREE.Mesh(
                new THREE.BoxGeometry(armW, armH, armD),
                seatDarkMem
            );
            rightArm.position.set(seatX + cushionW / 2 + armW / 2, cabBottom + cushionH + armH / 2, seatZ);
            this.cockpitGroup.add(rightArm);
        };

        addSeat(-0.25); // Pilot (left)
        addSeat( 0.25); // Co-pilot (right)

        // Cabin ceiling (roof frame — thin strip around edges, center open to wing)
        const ceilGeo = new THREE.PlaneGeometry(cabW, cabD);
        const ceil = new THREE.Mesh(ceilGeo, interiorMem);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(cabCX, cabTop, cabCZ);
        this.cockpitGroup.add(ceil);

        // Back wall
        const backWallGeo = new THREE.PlaneGeometry(cabW, cabH);
        const backWall = new THREE.Mesh(backWallGeo, rearWallMem);
        backWall.position.set(cabCX, cabCY, cabBack);
        this.cockpitGroup.add(backWall);

        // Dashboard (front lower wall — below windshield)
        // Tall enough to show a good portion of the interior photo behind the instrument cluster
        const dashH = cabH * 0.42;
        const dashGeo = new THREE.PlaneGeometry(cabW, dashH);
        const dashboard = new THREE.Mesh(dashGeo, dashboardMem);
        dashboard.position.set(cabCX, cabBottom + dashH / 2, cabFront);
        this.cockpitGroup.add(dashboard);

        // Front windshield (upper front — transparent glass)
        const windshieldH = cabH - dashH;
        const windshieldGeo = new THREE.PlaneGeometry(cabW, windshieldH);
        const windshield = new THREE.Mesh(windshieldGeo, glassMem);
        windshield.position.set(cabCX, cabBottom + dashH + windshieldH / 2, cabFront);
        this.cockpitGroup.add(windshield);

        // Side walls — split into lower opaque panel + upper transparent window
        const sideWallH = cabH * 0.4;
        const sideWindowH = cabH - sideWallH;
        const windowFrameThickness = 0.06;
        const windowFrameDepth = 0.03;
        const seamStripHeight = 0.03;
        const sideWindowCenterY = cabBottom + sideWallH + sideWindowH / 2;

        const addSideWindowTrim = (sideX, isLeftSide) => {
            const frameX = isLeftSide ? sideX + windowFrameDepth / 2 : sideX - windowFrameDepth / 2;
            const innerFrameHeight = Math.max(0.05, sideWindowH - windowFrameThickness * 2);

            const topFrame = new THREE.Mesh(
                new THREE.BoxGeometry(windowFrameDepth, windowFrameThickness, cabD),
                windowFrameMem
            );
            topFrame.position.set(frameX, sideWindowCenterY + sideWindowH / 2 - windowFrameThickness / 2, cabCZ);
            this.cockpitGroup.add(topFrame);

            const bottomFrame = new THREE.Mesh(
                new THREE.BoxGeometry(windowFrameDepth, windowFrameThickness, cabD),
                windowFrameMem
            );
            bottomFrame.position.set(frameX, sideWindowCenterY - sideWindowH / 2 + windowFrameThickness / 2, cabCZ);
            this.cockpitGroup.add(bottomFrame);

            const frontFrame = new THREE.Mesh(
                new THREE.BoxGeometry(windowFrameDepth, innerFrameHeight, windowFrameThickness),
                windowFrameMem
            );
            frontFrame.position.set(frameX, sideWindowCenterY, cabFront - windowFrameThickness / 2);
            this.cockpitGroup.add(frontFrame);

            const backFrame = new THREE.Mesh(
                new THREE.BoxGeometry(windowFrameDepth, innerFrameHeight, windowFrameThickness),
                windowFrameMem
            );
            backFrame.position.set(frameX, sideWindowCenterY, cabBack + windowFrameThickness / 2);
            this.cockpitGroup.add(backFrame);

            const seamStrip = new THREE.Mesh(
                new THREE.BoxGeometry(windowFrameDepth * 0.95, seamStripHeight, cabD - windowFrameThickness * 2),
                seamStripMem
            );
            seamStrip.position.set(frameX, cabBottom + sideWallH - seamStripHeight / 2, cabCZ);
            this.cockpitGroup.add(seamStrip);
        };

        // Left side
        const leftWallGeo = new THREE.PlaneGeometry(cabD, sideWallH);
        const leftWall = new THREE.Mesh(leftWallGeo, sideWallMem);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(cabLeft, cabBottom + sideWallH / 2, cabCZ);
        this.cockpitGroup.add(leftWall);

        const leftWindowGeo = new THREE.PlaneGeometry(cabD, sideWindowH);
        const leftWindow = new THREE.Mesh(leftWindowGeo, glassMem);
        leftWindow.rotation.y = Math.PI / 2;
        leftWindow.position.set(cabLeft, cabBottom + sideWallH + sideWindowH / 2, cabCZ);
        this.cockpitGroup.add(leftWindow);
        addSideWindowTrim(cabLeft, true);

        // Right side
        const rightWallGeo = new THREE.PlaneGeometry(cabD, sideWallH);
        const rightWall = new THREE.Mesh(rightWallGeo, sideWallMem);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(cabRight, cabBottom + sideWallH / 2, cabCZ);
        this.cockpitGroup.add(rightWall);

        const rightWindowGeo = new THREE.PlaneGeometry(cabD, sideWindowH);
        const rightWindow = new THREE.Mesh(rightWindowGeo, glassMem);
        rightWindow.rotation.y = -Math.PI / 2;
        rightWindow.position.set(cabRight, cabBottom + sideWallH + sideWindowH / 2, cabCZ);
        this.cockpitGroup.add(rightWindow);
        addSideWindowTrim(cabRight, false);

        // 2. High Wing — sits on top of cabin ceiling (cabTop = 1.2 mesh-local)
        const wingGeo = new THREE.BoxGeometry(11.0, 0.15, 1.4);
        const wing = new THREE.Mesh(wingGeo, whiteMem);
        wing.position.set(0, 1.35, 0.5); // Clear of cabin ceiling at y=1.2
        this.mesh.add(wing);

        // Wing struts (connecting lower fuselage to middle of wing)
        const strutGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8);
        const leftStrut = new THREE.Mesh(strutGeo, whiteMem);
        leftStrut.position.set(-1.0, 0.55, 0.5);
        leftStrut.rotation.z = 0.7; // Top points left, bottom points right
        this.exteriorGroup.add(leftStrut);

        const rightStrut = new THREE.Mesh(strutGeo, whiteMem);
        rightStrut.position.set(1.0, 0.55, 0.5);
        rightStrut.rotation.z = -0.7; // Top points right, bottom points left
        this.exteriorGroup.add(rightStrut);

        // 3. Tail Section
        // Horizontal stabilizer
        const hStabGeo = new THREE.BoxGeometry(3.2, 0.1, 0.8);
        const hStab = new THREE.Mesh(hStabGeo, whiteMem);
        hStab.position.set(0, 0.2, -2.8);
        this.exteriorGroup.add(hStab);

        // Vertical stabilizer
        const vStabGeo = new THREE.BoxGeometry(0.1, 1.4, 1.0);
        const vStab = new THREE.Mesh(vStabGeo, redMem); // Added color accent
        vStab.position.set(0, 0.8, -2.8);
        // Slant the leading edge back
        const vPos = vStabGeo.attributes.position;
        for (let i = 0; i < vPos.count; i++) {
            if (vPos.getY(i) > 0 && vPos.getZ(i) > 0) {
                vPos.setZ(i, vPos.getZ(i) - 0.5);
            }
        }
        vStabGeo.computeVertexNormals();
        this.exteriorGroup.add(vStab);

        // 4. Undercarriage (Tricycle gear)
        const strutMat = darkGrey;
        const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
        wheelGeo.rotateZ(Math.PI / 2); // Lay flat for wheels

        // Nose gear
        const noseStrutGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8);
        const noseStrut = new THREE.Mesh(noseStrutGeo, strutMat);
        noseStrut.position.set(0, -0.9, 2.2);
        this.exteriorGroup.add(noseStrut);

        const noseWheel = new THREE.Mesh(wheelGeo, blackMem);
        noseWheel.position.set(0, -1.3, 2.2);
        this.exteriorGroup.add(noseWheel);

        // Main gear (left/right)
        const mainStrutGeo = new THREE.BoxGeometry(0.1, 1.2, 0.2);

        const leftMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        leftMainStrut.position.set(-1.0, -0.8, 0.2);
        leftMainStrut.rotation.z = -Math.PI / 6;
        this.exteriorGroup.add(leftMainStrut);

        const leftWheel = new THREE.Mesh(wheelGeo, blackMem);
        leftWheel.position.set(-1.25, -1.3, 0.2);
        this.exteriorGroup.add(leftWheel);

        const rightMainStrut = new THREE.Mesh(mainStrutGeo, strutMat);
        rightMainStrut.position.set(1.0, -0.8, 0.2);
        rightMainStrut.rotation.z = Math.PI / 6;
        this.exteriorGroup.add(rightMainStrut);

        const rightWheel = new THREE.Mesh(wheelGeo, blackMem);
        rightWheel.position.set(1.25, -1.3, 0.2);
        this.exteriorGroup.add(rightWheel);

        // 5. Engine Cowling & Propeller
        const noseConeGeo = new THREE.BoxGeometry(1.0, 1.0, 0.6);
        const noseCone = new THREE.Mesh(noseConeGeo, redMem); // Color accent
        noseCone.position.set(0, -0.1, 3.3);
        this.exteriorGroup.add(noseCone);

        const spinnerGeo = new THREE.ConeGeometry(0.3, 0.4, 16);
        spinnerGeo.rotateX(Math.PI / 2);
        const spinner = new THREE.Mesh(spinnerGeo, whiteMem);
        spinner.position.set(0, -0.1, 3.8);
        this.exteriorGroup.add(spinner);

        // The propeller group that spins
        this.propeller = new THREE.Group();
        this.propeller.position.set(0, -0.1, 3.65);

        const bladeGeo = new THREE.BoxGeometry(3.6, 0.08, 0.02);
        const blade = new THREE.Mesh(bladeGeo, darkGrey);
        this.propeller.add(blade);

        this.mesh.add(this.propeller);

        // Add groups to main mesh
        this.mesh.add(this.exteriorGroup);
        this.mesh.add(this.cockpitGroup);
        this.cockpitGroup.visible = false; // Hidden by default (chase view)

        // Final adjustment so aircraft origin sits on the wheels (bottom = -1.55 roughly)
        // We lift it up so 0,0,0 is at the lowest wheel point
        this.mesh.position.y = 1.45;
        this.mesh.rotation.y = Math.PI; // Face standard WebGL forward (-Z)
    }

    createCarpetTexture() {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Dark charcoal base
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, size, size);

        // Fine fiber noise — very tight, dark grey
        const imgData = ctx.getImageData(0, 0, size, size);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const v = 20 + Math.floor(Math.random() * 22);
            imgData.data[i]     = v;
            imgData.data[i + 1] = v;
            imgData.data[i + 2] = v;
            imgData.data[i + 3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);

        // Subtle horizontal weave lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let y = 0; y < size; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(size, y + 0.5);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        if ('colorSpace' in texture && THREE.SRGBColorSpace) {
            texture.colorSpace = THREE.SRGBColorSpace;
        }
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 3);
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        return texture;
    }

    createCreamSideWallTexture() {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');

        const baseGrad = ctx.createLinearGradient(0, 0, 0, size);
        baseGrad.addColorStop(0, '#e5dfcf');
        baseGrad.addColorStop(0.5, '#d8cfbb');
        baseGrad.addColorStop(1, '#cfc5ae');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, size, size);

        const cell = 32;
        for (let y = 0; y < size; y += cell) {
            for (let x = 0; x < size; x += cell) {
                const toneA = 188 + Math.floor(Math.random() * 18);
                const toneB = 168 + Math.floor(Math.random() * 18);
                const toneC = 150 + Math.floor(Math.random() * 18);

                ctx.fillStyle = `rgb(${toneA}, ${toneA - 4}, ${toneA - 12})`;
                ctx.beginPath();
                ctx.moveTo(x, y + cell);
                ctx.lineTo(x + cell * 0.5, y + cell * 0.5);
                ctx.lineTo(x + cell, y + cell);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = `rgb(${toneB}, ${toneB - 6}, ${toneB - 14})`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cell * 0.5, y + cell * 0.5);
                ctx.lineTo(x + cell, y);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = `rgb(${toneC}, ${toneC - 8}, ${toneC - 16})`;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cell * 0.5, y + cell * 0.5);
                ctx.lineTo(x, y + cell);
                ctx.closePath();
                ctx.fill();
            }
        }

        const noise = ctx.getImageData(0, 0, size, size);
        for (let i = 0; i < noise.data.length; i += 4) {
            const grain = Math.floor((Math.random() - 0.5) * 16);
            noise.data[i] = Math.max(0, Math.min(255, noise.data[i] + grain));
            noise.data[i + 1] = Math.max(0, Math.min(255, noise.data[i + 1] + grain));
            noise.data[i + 2] = Math.max(0, Math.min(255, noise.data[i + 2] + grain));
        }
        ctx.putImageData(noise, 0, 0);

        ctx.strokeStyle = 'rgba(120, 108, 92, 0.35)';
        ctx.lineWidth = 2;
        for (let y = 0; y <= size; y += cell * 4) {
            ctx.beginPath();
            ctx.moveTo(0, y + 0.5);
            ctx.lineTo(size, y + 0.5);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        if ('colorSpace' in texture && THREE.SRGBColorSpace) {
            texture.colorSpace = THREE.SRGBColorSpace;
        } else if ('encoding' in texture && THREE.sRGBEncoding) {
            texture.encoding = THREE.sRGBEncoding;
        }
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1.5, 1.0);
        texture.anisotropy = 4;
        texture.needsUpdate = true;

        return texture;
    }

    setCockpitMode(isCockpit) {
        this.exteriorGroup.visible = !isCockpit;
        this.cockpitGroup.visible = isCockpit;
        // Debug: Log when cockpit mode changes
        if (this._lastCockpitMode !== isCockpit) {
            console.log(`setCockpitMode(${isCockpit}): exterior=${this.exteriorGroup.visible}, cockpit=${this.cockpitGroup.visible}, extChildren=${this.exteriorGroup.children.length}, cockChildren=${this.cockpitGroup.children.length}`);
            this._lastCockpitMode = isCockpit;
        }
    }

    update(dt, engineRunning, rpm) {
        if (engineRunning) {
            // Spin propeller visually
            // Very fast rotation looks better with motion blur, but simple rotation is fine for now
            // Modulo math ensures it stays within standard rotation ranges
            const spinRate = rpm > 0 ? (rpm / 60) * Math.PI * 2 : 10;
            this.propeller.rotation.z += spinRate * dt;
        }
    }
}
