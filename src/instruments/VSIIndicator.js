import { DialRenderer } from './DialRenderer.js';

export class VSIIndicator {
    render(ctx, x, y, radius, vspeedFpm) {
        // Background
        DialRenderer.drawBezel(ctx, x, y, radius, '#1a1a1a', '#666', 3);

        // VSI range: -2000 to +2000 fpm
        // 0 is at 9 o'clock, positive goes clockwise up, negative goes clockwise down
        // Layout: 0 at right (3 o'clock), +2000 at top, -2000 at bottom
        const zeroAngle = Math.PI; // 9 o'clock = 0 fpm

        // Tick marks
        const maxFpm = 2000;
        const tickValues = [-2000, -1500, -1000, -500, 0, 500, 1000, 1500, 2000];

        tickValues.forEach(fpm => {
            // Map fpm to angle: 0 at 9 o'clock, +2000 at 12 o'clock, -2000 at 6 o'clock
            const angle = zeroAngle - (fpm / maxFpm) * (Math.PI / 2);
            const isMajor = Math.abs(fpm) % 1000 === 0;
            const len = isMajor ? 16 : 10;

            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius - len - 4), y + Math.sin(angle) * (radius - len - 4));
            ctx.lineTo(x + Math.cos(angle) * (radius - 4), y + Math.sin(angle) * (radius - 4));
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.stroke();
        });

        // Number labels
        const labelValues = [-2, -1, 0, 1, 2]; // in thousands
        const labelRadius = radius - 28;
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(radius * 0.2)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        labelValues.forEach(val => {
            const fpm = val * 1000;
            const angle = zeroAngle - (fpm / maxFpm) * (Math.PI / 2);
            ctx.fillText(Math.abs(val).toString(), x + Math.cos(angle) * labelRadius, y + Math.sin(angle) * labelRadius);
        });

        // UP / DN labels
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.13)}px sans-serif`;
        ctx.fillText('UP', x - radius * 0.25, y - radius * 0.45);
        ctx.fillText('DN', x - radius * 0.25, y + radius * 0.45);

        // Needle — drawNeedle draws tip at 12 o'clock when angle=0, clockwise positive.
        // VSI: 0 fpm = 9 o'clock (-π/2), +2000 fpm = 12 o'clock (0), -2000 fpm = 6 o'clock (π)
        const clampedVs = Math.max(-maxFpm, Math.min(maxFpm, vspeedFpm));
        const needleAngle = -Math.PI / 2 + (clampedVs / maxFpm) * (Math.PI / 2);
        DialRenderer.drawNeedle(ctx, x, y, radius - 22, needleAngle, '#fff', 2, 8);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('VERTICAL SPEED', x + radius * 0.15, y);
        ctx.fillText('FT/MIN', x + radius * 0.15, y + radius * 0.14);
    }
}
