import { DialRenderer } from './DialRenderer.js';

export class AirspeedIndicator {
    render(ctx, x, y, radius, airspeedKnots) {
        // Background
        DialRenderer.drawBezel(ctx, x, y, radius, '#1a1a1a', '#666', 3);

        // Airspeed range: 0-200 knots
        // Dial sweeps from ~7 o'clock to ~5 o'clock (about 240 degrees)
        const startAngle = Math.PI * 0.75;   // 7 o'clock
        const endAngle = Math.PI * 2.25;     // 5 o'clock
        const maxSpeed = 200;

        // Green arc (normal operating: 55-130 kts)
        this.drawArc(ctx, x, y, radius - 10, startAngle, endAngle, 55, 130, maxSpeed, '#00cc44', 6);
        // White arc (flaps operating: 40-100 kts)
        this.drawArc(ctx, x, y, radius - 16, startAngle, endAngle, 40, 100, maxSpeed, '#ffffff', 4);
        // Yellow arc (caution: 130-165 kts)
        this.drawArc(ctx, x, y, radius - 10, startAngle, endAngle, 130, 165, maxSpeed, '#ffcc00', 6);
        // Red line (never exceed: 165 kts)
        const neAngle = startAngle + (165 / maxSpeed) * (endAngle - startAngle);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(neAngle) * (radius - 20), y + Math.sin(neAngle) * (radius - 20));
        ctx.lineTo(x + Math.cos(neAngle) * (radius - 4), y + Math.sin(neAngle) * (radius - 4));
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tick marks - 20 major ticks, every 20 knots
        const tickCount = 40; // total minor ticks
        DialRenderer.drawTicks(ctx, x, y, radius - 4, tickCount, 4, startAngle, endAngle, 8, 16, '#ccc');

        // Tick labels
        const labelRadius = radius - 28;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(radius * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let spd = 0; spd <= maxSpeed; spd += 20) {
            const angle = startAngle + (spd / maxSpeed) * (endAngle - startAngle);
            ctx.fillText(spd.toString(), x + Math.cos(angle) * labelRadius, y + Math.sin(angle) * labelRadius);
        }

        // Needle
        const clampedSpeed = Math.max(0, Math.min(maxSpeed, airspeedKnots));
        const needleAngle = startAngle + (clampedSpeed / maxSpeed) * (endAngle - startAngle) + Math.PI / 2;
        DialRenderer.drawNeedle(ctx, x, y, radius - 20, needleAngle, '#fff', 2, 8);

        // Label
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(radius * 0.15)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('AIRSPEED', x, y + radius * 0.35);
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.fillText('KNOTS', x, y + radius * 0.5);
    }

    drawArc(ctx, x, y, radius, dialStart, dialEnd, from, to, max, color, width) {
        const aStart = dialStart + (from / max) * (dialEnd - dialStart);
        const aEnd = dialStart + (to / max) * (dialEnd - dialStart);
        ctx.beginPath();
        ctx.arc(x, y, radius, aStart, aEnd);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
    }
}
