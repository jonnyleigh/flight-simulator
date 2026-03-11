/**
 * MapView.js
 * Renders a scrollable, zoomable 2D top-down world map on a canvas overlay.
 * Pauses the simulation while open. Aircraft and airport positions are shown
 * as icons. The terrain colour is sampled from WorldGenerator.
 *
 * Usage:
 *   const mapView = new MapView(gameState, worldGenerator, airportManager);
 *   mapView.toggle();   // open / close
 */
export class MapView {
    /**
     * @param {object} gameState         - Shared GameState object
     * @param {object} worldGenerator    - WorldGenerator instance (for height sampling)
     * @param {object} airportManager    - AirportManager instance (for icon positions)
     */
    constructor(gameState, worldGenerator, airportManager) {
        this.gameState      = gameState;
        this.worldGenerator = worldGenerator;
        this.airportManager = airportManager;

        this.isOpen = false;
        this._wasPausedBeforeMap = false;

        // View state: zoom is metres per canvas pixel; pan is offset in canvas pixels
        this.zoom = 500;         // 500 m/px shows the full 256 km world in ~512px
        this.panX = 0;
        this.panY = 0;

        this.MIN_ZOOM = 50;      // zoomed in  — 50 m/px
        this.MAX_ZOOM = 700;     // zoomed out — 700 m/px

        // Cached terrain image (generated once on first open)
        this._terrainCanvas = null;

        // Drag state
        this._dragging   = false;
        this._lastMouseX = 0;
        this._lastMouseY = 0;

        // Build the DOM overlay (hidden initially)
        this._buildDOM();
        this._attachListeners();
    }

    // ------------------------------------------------------------------ //
    //  Public API
    // ------------------------------------------------------------------ //

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Pause the simulation while map is open
        this._wasPausedBeforeMap = this.gameState.flags.isPaused;
        this.gameState.flags.isPaused  = true;
        this.gameState.flags.showMap   = true;

        this.overlay.style.display = 'flex';

        if (!this._terrainCanvas) {
            // Show a loading message on the canvas, then generate terrain on the next frame
            this.ctx.fillStyle = '#0d1820';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#aaa';
            this.ctx.font = '20px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Generating map…', this.canvas.width / 2, this.canvas.height / 2);

            // Defer generation by one frame so the browser can paint the overlay first
            requestAnimationFrame(() => {
                this._generateTerrainTexture();
                this._render();
            });
        } else {
            this._render();
        }
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;

        // Restore sim pause state
        this.gameState.flags.isPaused = this._wasPausedBeforeMap;
        this.gameState.flags.showMap  = false;

        this.overlay.style.display = 'none';
    }

    // ------------------------------------------------------------------ //
    //  DOM Construction
    // ------------------------------------------------------------------ //

    _buildDOM() {
        const uiLayer = document.getElementById('ui-layer');

        // Full-screen semi-transparent overlay
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position:absolute; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.88); display:none;
            flex-direction:column; align-items:center; justify-content:center;
            z-index:300; user-select:none; pointer-events:auto;
        `;

        // Title bar
        const titleBar = document.createElement('div');
        titleBar.style.cssText = `
            width:90%; max-width:900px; display:flex; justify-content:space-between;
            align-items:center; margin-bottom:8px; color:#ddd; font-family:sans-serif;
        `;
        titleBar.innerHTML = `
            <span style="font-size:1.2rem; font-weight:bold; letter-spacing:2px;">MAP VIEW</span>
            <span style="font-size:0.85rem; color:#aaa;">
                Drag to pan &nbsp;|&nbsp; Scroll to zoom &nbsp;|&nbsp; <kbd style="background:#444;padding:1px 5px;border-radius:3px;">M</kbd> to close
            </span>
            <button id="map-close-btn" style="
                background:#555; border:none; color:#fff; padding:5px 14px;
                border-radius:4px; cursor:pointer; font-size:0.9rem;">✕ Close</button>
        `;
        this.overlay.appendChild(titleBar);

        // Canvas wrapper
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position:relative; width:90%; max-width:900px;
        `;

        // Map canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = `
            display:block; border:1px solid #444; border-radius:4px;
            cursor:grab; width:100%; height:auto;
        `;
        // We'll set pixel dimensions after measuring in _render
        this.canvas.width  = 900;
        this.canvas.height = 700;
        this.ctx = this.canvas.getContext('2d');

        wrapper.appendChild(this.canvas);
        this.overlay.appendChild(wrapper);

        // Legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            margin-top:8px; display:flex; gap:12px; flex-wrap:wrap;
            justify-content:center; font-family:sans-serif; font-size:0.78rem; color:#ccc;
        `;
        legend.innerHTML = [
            ['#1a3a6e','Deep Water'], ['#2a5fa8','Shallow Water'],
            ['#d2be78','Sand'],       ['#5cbd3a','Lowland'],
            ['#3a8a28','Grassland'],  ['#8b7355','Hills'],
            ['#6b5030','Mountains'],  ['#d0d0cc','Snow'],
        ].map(([c, l]) =>
            `<span><span style="display:inline-block;width:12px;height:12px;background:${c};vertical-align:middle;border-radius:2px;margin-right:4px;"></span>${l}</span>`
        ).join('');
        this.overlay.appendChild(legend);

        uiLayer.appendChild(this.overlay);
    }

    // ------------------------------------------------------------------ //
    //  Event Listeners
    // ------------------------------------------------------------------ //

    _attachListeners() {
        // Close button
        this.overlay.addEventListener('click', e => {
            if (e.target && e.target.id === 'map-close-btn') this.close();
        });

        // Mouse drag (pan)
        this.canvas.addEventListener('mousedown', e => {
            this._dragging   = true;
            this._lastMouseX = e.clientX;
            this._lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        window.addEventListener('mousemove', e => {
            if (!this._dragging || !this.isOpen) return;
            this.panX += e.clientX - this._lastMouseX;
            this.panY += e.clientY - this._lastMouseY;
            this._lastMouseX = e.clientX;
            this._lastMouseY = e.clientY;
            this._render();
        });
        window.addEventListener('mouseup', () => {
            this._dragging = false;
            if (this.canvas) this.canvas.style.cursor = 'grab';
        });

        // Touch drag (pan)
        this.canvas.addEventListener('touchstart', e => {
            if (e.touches.length === 1) {
                this._dragging   = true;
                this._lastMouseX = e.touches[0].clientX;
                this._lastMouseY = e.touches[0].clientY;
            }
        }, { passive: true });
        this.canvas.addEventListener('touchmove', e => {
            if (!this._dragging || e.touches.length !== 1) return;
            this.panX += e.touches[0].clientX - this._lastMouseX;
            this.panY += e.touches[0].clientY - this._lastMouseY;
            this._lastMouseX = e.touches[0].clientX;
            this._lastMouseY = e.touches[0].clientY;
            this._render();
        }, { passive: true });
        this.canvas.addEventListener('touchend', () => { this._dragging = false; });

        // Scroll wheel (zoom)
        this.canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 1.15 : 0.87;
            this.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, this.zoom * factor));
            this._render();
        }, { passive: false });
    }

    // ------------------------------------------------------------------ //
    //  Terrain Texture Generation
    // ------------------------------------------------------------------ //

    /**
     * Generate a 512×512 ImageData representing the full 256 km world.
     * Each pixel covers (256000 / 512) = 500m.
     * Runs synchronously; takes ~100–200ms on first call.
     */
    _generateTerrainTexture() {
        const SAMPLES = 512;
        const WORLD   = 256000; // metres
        const HALF    = WORLD / 2;
        const STEP    = WORLD / SAMPLES;

        this._terrainCanvas = document.createElement('canvas');
        this._terrainCanvas.width  = SAMPLES;
        this._terrainCanvas.height = SAMPLES;
        const tCtx = this._terrainCanvas.getContext('2d');
        const img  = tCtx.createImageData(SAMPLES, SAMPLES);

        for (let py = 0; py < SAMPLES; py++) {
            for (let px = 0; px < SAMPLES; px++) {
                const worldX =  (px + 0.5) * STEP - HALF;
                // Canvas row 0 = top = north (-Z in Three.js); row increases going south.
                // So worldZ goes from -HALF (north, row 0) to +HALF (south, row SAMPLES-1).
                const worldZ = (py + 0.5) * STEP - HALF;
                const h  = this.worldGenerator.getHeightAt(worldX, worldZ);
                const [r, g, b] = MapView._heightToRGB(h);
                const i  = (py * SAMPLES + px) * 4;
                img.data[i]   = r;
                img.data[i+1] = g;
                img.data[i+2] = b;
                img.data[i+3] = 255;
            }
        }

        tCtx.putImageData(img, 0, 0);
        console.log('[MapView] Terrain texture generated.');
    }

    /**
     * Map a terrain height (metres) to an RGB colour.
     * @param {number} h - Elevation in metres
     * @returns {[number, number, number]}
     */
    static _heightToRGB(h) {
        if (h < -20) return [26,  58, 110]; // deep water
        if (h < 0)   return [42,  95, 168]; // shallow water
        if (h < 8)   return [210, 190, 120]; // sand/beach
        if (h < 120) return [92,  189,  58]; // lowland
        if (h < 320) return [58,  138,  40]; // grassland
        if (h < 550) return [139, 115,  85]; // hills
        if (h < 950) return [107,  80,  48]; // mountains
        return                [208, 208, 204];  // snow caps
    }

    // ------------------------------------------------------------------ //
    //  Render
    // ------------------------------------------------------------------ //

    _render() {
        if (!this.isOpen || !this._terrainCanvas) return;

        const W   = this.canvas.width;
        const H   = this.canvas.height;
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#0d1820';
        ctx.fillRect(0, 0, W, H);

        // ---- Draw terrain texture ----
        const WORLD_SIZE  = 256000;
        const drawW  = WORLD_SIZE / this.zoom;
        const drawH  = WORLD_SIZE / this.zoom;
        const drawX  = W / 2 + this.panX - drawW / 2;
        const drawY  = H / 2 + this.panY - drawH / 2;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
        ctx.drawImage(this._terrainCanvas, drawX, drawY, drawW, drawH);

        // ---- World border ----
        ctx.strokeStyle = '#ff6622';
        ctx.lineWidth   = 2;
        ctx.strokeRect(drawX, drawY, drawW, drawH);

        // ---- Airport icons ----
        if (this.airportManager) {
            for (const airport of this.airportManager.getAirports()) {
                const [cx, cy] = this._worldToCanvas(airport.position.x, airport.position.z, W, H);
                this._drawAirportIcon(ctx, cx, cy, airport.icao, airport.runwayHeading);
            }
        }

        // ---- Aircraft icon ----
        const ac = this.gameState.aircraft;
        const [ax, ay] = this._worldToCanvas(ac.position.x, ac.position.z, W, H);
        this._drawAircraftIcon(ctx, ax, ay, ac.heading);

        // ---- Scale bar ----
        this._drawScalebar(ctx, W, H);

        // ---- Compass rose (N indicator) ----
        this._drawCompass(ctx, W, H);

        // ---- Coordinates under cursor could go here ----
    }

    /**
     * Convert world (x, z) coordinates to canvas (px, py).
     * Three.js convention: -Z = north, +Z = south, +X = east.
     * Canvas convention: small Y = top = north, large Y = bottom = south.
     * So worldZ maps directly to canvas Y (both increase southward).
     */
    _worldToCanvas(worldX, worldZ, W, H) {
        const px = W / 2 + this.panX + worldX / this.zoom;
        const py = H / 2 + this.panY + worldZ / this.zoom;  // +Z = south = canvas down
        return [px, py];
    }

    // ------------------------------------------------------------------ //
    //  Icon drawing helpers
    // ------------------------------------------------------------------ //

    _drawAircraftIcon(ctx, cx, cy, headingRad) {
        ctx.save();
        ctx.translate(cx, cy);
        // headingRad: 0 = north (-Z), increases clockwise
        // Canvas: 0 = pointing right (+X), CCW. So canvas angle = -(headingRad - PI/2)
        ctx.rotate(headingRad);  // heading is already 0=north aligned via our coord mapping

        // Aircraft symbol (simple arrow)
        ctx.fillStyle   = '#ffdd00';
        ctx.strokeStyle = '#000';
        ctx.lineWidth   = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, -10);     // nose
        ctx.lineTo(7, 6);
        ctx.lineTo(0, 2);
        ctx.lineTo(-7, 6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        // Label
        ctx.fillStyle   = '#ffdd00';
        ctx.font        = 'bold 11px sans-serif';
        ctx.textAlign   = 'left';
        ctx.fillText('YOU', cx + 12, cy - 4);
    }

    _drawAirportIcon(ctx, cx, cy, icao, runwayHeadingDeg = 0) {
        ctx.save();
        ctx.translate(cx, cy);

        // Circles
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#aaaaff';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Runway direction indicator
        const headingRad = (runwayHeadingDeg || 0) * Math.PI / 180;
        ctx.rotate(headingRad);

        // Runway axis
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);  ctx.lineTo(0, 8);
        ctx.stroke();

        // Direction arrow at runway heading end
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-3, -5);
        ctx.lineTo(3, -5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // ICAO label
        ctx.fillStyle   = '#0a0aee';
        ctx.font        = 'bold 11px monospace';
        ctx.textAlign   = 'center';
        ctx.fillText(icao, cx, cy + 22);
    }

    _drawScalebar(ctx, W, H) {
        // Choose a nice round number for the scale bar
        const scales = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
        const targetPx = 80;
        let bestScale = scales[0];
        for (const s of scales) {
            if (s / this.zoom < targetPx) bestScale = s;
        }
        const barPx  = bestScale / this.zoom;
        const bx     = 20;
        const by     = H - 25;

        ctx.strokeStyle = '#fff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + barPx, by);
        ctx.moveTo(bx, by - 4);
        ctx.lineTo(bx, by + 4);
        ctx.moveTo(bx + barPx, by - 4);
        ctx.lineTo(bx + barPx, by + 4);
        ctx.stroke();

        ctx.fillStyle   = '#fff';
        ctx.font        = '11px sans-serif';
        ctx.textAlign   = 'left';
        const label = bestScale >= 1000 ? `${bestScale / 1000} km` : `${bestScale} m`;
        ctx.fillText(label, bx, by - 8);
    }

    _drawCompass(ctx, W, H) {
        const cx = W - 30;
        const cy = 30;
        const r  = 16;

        ctx.strokeStyle = '#ccc';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        // N arrow pointing up (north = up = -Z)
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r + 2);
        ctx.lineTo(cx - 4, cy);
        ctx.lineTo(cx + 4, cy);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle   = '#fff';
        ctx.font        = 'bold 10px sans-serif';
        ctx.textAlign   = 'center';
        ctx.fillText('N', cx, cy - r - 3);
    }
}
