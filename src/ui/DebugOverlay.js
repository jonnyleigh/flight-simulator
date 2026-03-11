export class DebugOverlay {
    constructor(gameState) {
        this.gameState = gameState;
        this.container = document.getElementById('ui-layer');
        this.element = null;
        this.isVisible = false;

        // Input elements
        this.inputX = null;
        this.inputZ = null;
        this.inputAlt = null;
        this.statsElement = null;
    }

    init() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '10px';
        this.element.style.right = '10px';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.element.style.color = '#0f0';
        this.element.style.fontFamily = 'monospace';
        this.element.style.padding = '10px';
        this.element.style.borderRadius = '5px';
        this.element.style.pointerEvents = 'auto';
        this.element.style.zIndex = '200';
        this.element.style.display = 'none'; // Hidden by default

        this.element.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #fff; border-bottom: 1px solid #555; padding-bottom: 5px; font-size: 14px;">Debug Overlay</h3>
            <div id="debug-stats" style="margin-bottom: 15px; line-height: 1.5; font-size: 12px;"></div>
            <div style="border-top: 1px solid #555; padding-top: 10px;">
                <h4 style="margin: 0 0 5px 0; color: #aaa; font-size: 12px;">Teleport</h4>
                <div style="display: flex; gap: 5px; margin-bottom: 5px;">
                    <input type="number" id="debug-x" placeholder="X (km)" style="width: 50px; background: #222; color: #0f0; border: 1px solid #444; padding: 2px; font-family: monospace;">
                    <input type="number" id="debug-alt" placeholder="Alt (ft)" style="width: 60px; background: #222; color: #0f0; border: 1px solid #444; padding: 2px; font-family: monospace;">
                    <input type="number" id="debug-z" placeholder="Z (km)" style="width: 50px; background: #222; color: #0f0; border: 1px solid #444; padding: 2px; font-family: monospace;">
                </div>
                <button id="debug-teleport" style="width: 100%; background: #444; color: #fff; border: 1px solid #666; cursor: pointer; padding: 4px; font-size: 11px;">Set Position</button>
            </div>
        `;

        this.container.appendChild(this.element);

        this.statsElement = document.getElementById('debug-stats');
        this.inputX = document.getElementById('debug-x');
        this.inputAlt = document.getElementById('debug-alt');
        this.inputZ = document.getElementById('debug-z');

        // Prevent UI events from bleeding through to game if we were listening for clicks globally
        this.element.addEventListener('mousedown', (e) => e.stopPropagation());
        // For inputs, prevent keydown from bleeding through
        this.element.addEventListener('keydown', (e) => {
            if (e.code !== 'Backquote') {
                e.stopPropagation();
            }
        });

        document.getElementById('debug-teleport').addEventListener('click', () => {
            const x = parseFloat(this.inputX.value);
            const altFt = parseFloat(this.inputAlt.value);
            const z = parseFloat(this.inputZ.value);

            if (!isNaN(x)) this.gameState.aircraft.position.x = x * 1000; // km to m
            if (!isNaN(altFt)) {
                const altM = altFt / 3.28084; // ft to m
                this.gameState.aircraft.position.y = altM;
                this.gameState.aircraft.altitude = altM;
            }
            if (!isNaN(z)) this.gameState.aircraft.position.z = z * 1000; // km to m

            console.log(`Teleported to X:${x}km, Alt:${altFt}ft, Z:${z}km`);
        });

        // Keydown listener for backtick
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Backquote') {
                this.toggle();
            }
        });
    }

    toggle() {
        if (!this.gameState.settings.devMode) return;
        this.isVisible = !this.isVisible;
        this.element.style.display = this.isVisible ? 'block' : 'none';

        if (this.isVisible) {
            // Populate current values when opening
            const pos = this.gameState.aircraft.position;
            this.inputX.value = (pos.x / 1000).toFixed(2);
            this.inputZ.value = (pos.z / 1000).toFixed(2);
            this.inputAlt.value = (pos.y * 3.28084).toFixed(0);
        }
    }

    update(fps, terrainHeight, activeChunks, airspeed = 0, vspeed = 0, lift = 0) {
        if (!this.isVisible) return;

        const pos = this.gameState.aircraft.position;
        const kmX = (pos.x / 1000).toFixed(2);
        const kmZ = (pos.z / 1000).toFixed(2);
        const altFt = pos.y * 3.28084;
        const vspeedStr = vspeed.toFixed(0);

        this.statsElement.innerHTML = `
            FPS: ${fps}<br>
            Pos: ${kmX} km, ${kmZ} km<br>
            Alt: ${altFt.toFixed(0)} ft<br>
            Terr Hgt: ${terrainHeight.toFixed(1)} m<br>
            Chunks: ${activeChunks}<br>
            Airspeed: ${airspeed.toFixed(0)} kts<br>
            V/S: ${vspeedStr} fpm<br>
            Lift: ${(lift / 1000).toFixed(1)} kN
        `;
    }
}
