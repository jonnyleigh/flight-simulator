import { AirspeedIndicator } from './AirspeedIndicator.js';
import { AttitudeIndicator } from './AttitudeIndicator.js';
import { Altimeter } from './Altimeter.js';
import { TurnCoordinator } from './TurnCoordinator.js';
import { HeadingIndicator } from './HeadingIndicator.js';
import { VSIIndicator } from './VSIIndicator.js';
import { SecondaryInstruments } from './SecondaryInstruments.js';

export class InstrumentPanel {
    constructor(gameState) {
        this.gameState = gameState;

        // Create canvas overlay
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'instrument-layer';
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '100';

        const container = document.getElementById('ui-layer') || document.body;
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d');

        // Instrument instances
        this.airspeed = new AirspeedIndicator();
        this.attitude = new AttitudeIndicator();
        this.altimeter = new Altimeter();
        this.turnCoord = new TurnCoordinator();
        this.heading = new HeadingIndicator();
        this.vsi = new VSIIndicator();
        this.secondary = new SecondaryInstruments();

        // Handle resize
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // The instrument canvas covers the bottom portion of the screen
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    update() {
        // Only show instruments in cockpit mode
        if (this.gameState.camera.mode !== 'cockpit') {
            this.canvas.style.display = 'none';
            return;
        }
        this.canvas.style.display = 'block';

        const ctx = this.ctx;
        const w = window.innerWidth;
        const h = window.innerHeight;

        // Clear the canvas
        ctx.clearRect(0, 0, w, h);

        // Calculate instrument layout
        // Six-pack: 3 on top row, 3 on bottom row, positioned at the bottom-center of the screen
        const dialSize = Math.min(w / 6, h / 4.5, 130); // Responsive sizing
        const dialRadius = dialSize * 0.46;
        const dialSpacing = dialSize * 1.05;

        // Panel background
        const panelWidth = dialSpacing * 3 + 30;
        const panelHeight = dialSpacing * 2 + 30;
        const panelX = (w - panelWidth) / 2;
        const panelY = h - panelHeight - 10;

        ctx.fillStyle = 'rgba(30, 30, 30, 0.88)';
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 8);
        ctx.fill();
        ctx.stroke();

        // Center of the six-pack grid
        const gridStartX = panelX + 15 + dialSpacing / 2;
        const gridStartY = panelY + 15 + dialSpacing / 2;

        // Row 1: ASI, Attitude, Altimeter
        const row1Y = gridStartY;
        const col1X = gridStartX;
        const col2X = gridStartX + dialSpacing;
        const col3X = gridStartX + dialSpacing * 2;

        // Row 2: Turn Coord, Heading, VSI
        const row2Y = gridStartY + dialSpacing;

        // Read state values
        const aircraft = this.gameState.aircraft;
        const airspeedKnots = aircraft.airspeed * 1.94384;
        const altFeet = aircraft.position.y * 3.28084;
        const vspeedFpm = aircraft.verticalSpeed * 196.85;

        // Draw Six-Pack
        this.airspeed.render(ctx, col1X, row1Y, dialRadius, airspeedKnots);
        this.attitude.render(ctx, col2X, row1Y, dialRadius, aircraft.rotation.pitch, aircraft.rotation.roll);
        this.altimeter.render(ctx, col3X, row1Y, dialRadius, altFeet);

        this.turnCoord.render(ctx, col1X, row2Y, dialRadius, aircraft.turnRate, aircraft.slip);
        this.heading.render(ctx, col2X, row2Y, dialRadius, aircraft.heading);
        this.vsi.render(ctx, col3X, row2Y, dialRadius, vspeedFpm);

        // Secondary instruments panel to the right of the six-pack
        const secWidth = 120;
        const secHeight = panelHeight - 10;
        const secX = panelX + panelWidth + 10;
        const secY = panelY + 5;

        this.secondary.render(ctx, secX, secY, secWidth, secHeight, this.gameState);
    }
}
