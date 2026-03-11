import { DialRenderer } from './DialRenderer.js';

export class Altimeter {
    render(ctx, x, y, radius, altitudeFeet) {
        // Background
        DialRenderer.drawBezel(ctx, x, y, radius, '#1a1a1a', '#666', 3);

        // The altimeter has one full rotation = 1000 ft for the long needle
        // Short needle shows thousands
        const startAngle = -Math.PI / 2; // 12 o'clock = 0

        // Tick marks - 50 ft increments (20 ticks per 1000 ft revolution)
        const tickCount = 50;
        for (let i = 0; i < tickCount; i++) {
            const angle = startAngle + (i / tickCount) * Math.PI * 2;
            const isHundred = i % 5 === 0;
            const len = isHundred ? 16 : 8;

            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius - len - 4), y + Math.sin(angle) * (radius - len - 4));
            ctx.lineTo(x + Math.cos(angle) * (radius - 4), y + Math.sin(angle) * (radius - 4));
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = isHundred ? 2 : 1;
            ctx.stroke();
        }

        // Number labels (0-9 for hundreds)
        const labelRadius = radius - 28;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(radius * 0.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < 10; i++) {
            const angle = startAngle + (i / 10) * Math.PI * 2;
            ctx.fillText(i.toString(), x + Math.cos(angle) * labelRadius, y + Math.sin(angle) * labelRadius);
        }

        // Altitude readout in the center
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(radius * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        const alt = Math.max(0, Math.round(altitudeFeet));
        ctx.fillText(alt.toFixed(0) + ' ft', x, y + radius * 0.55);

        // 1000s needle (short, thick)
        const thousandsAngle = startAngle + ((altitudeFeet % 10000) / 10000) * Math.PI * 2 + Math.PI / 2;
        DialRenderer.drawNeedle(ctx, x, y, radius * 0.5, thousandsAngle, '#fff', 4, 6);

        // 100s needle (long, thin)
        const hundredsAngle = startAngle + ((altitudeFeet % 1000) / 1000) * Math.PI * 2 + Math.PI / 2;
        DialRenderer.drawNeedle(ctx, x, y, radius - 22, hundredsAngle, '#fff', 2, 10);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.fillText('ALT', x, y - radius * 0.25);
    }
}
