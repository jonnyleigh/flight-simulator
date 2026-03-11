export class TurnCoordinator {
    render(ctx, x, y, radius, turnRate, slip) {
        // Background
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#666';
        ctx.stroke();

        // Turn rate marks at standard rate (3 deg/s = one tick mark each side)
        const markAngles = [-30, -20, 0, 20, 30]; // degrees
        markAngles.forEach(deg => {
            const rad = (deg - 90) * Math.PI / 180;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(rad) * (radius - 14), y + Math.sin(rad) * (radius - 14));
            ctx.lineTo(x + Math.cos(rad) * (radius - 4), y + Math.sin(rad) * (radius - 4));
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = deg === 0 ? 2 : 1.5;
            ctx.stroke();
        });

        // L and R labels
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.14)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('L', x - radius * 0.55, y - radius * 0.55);
        ctx.fillText('R', x + radius * 0.55, y - radius * 0.55);

        // Aircraft symbol that tilts with turn rate
        // Clamp turn rate display to ±45 degrees visual
        const maxTilt = Math.PI / 4;
        const tiltAngle = Math.max(-maxTilt, Math.min(maxTilt, turnRate * 5));

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(tiltAngle);

        // Draw miniature aircraft shape
        // Wings
        ctx.beginPath();
        ctx.moveTo(-radius * 0.45, 0);
        ctx.lineTo(radius * 0.45, 0);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Fuselage  
        ctx.beginPath();
        ctx.moveTo(0, radius * 0.15);
        ctx.lineTo(0, -radius * 0.05);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Tail
        ctx.beginPath();
        ctx.moveTo(-radius * 0.12, radius * 0.15);
        ctx.lineTo(radius * 0.12, radius * 0.15);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // Slip/skid ball
        const ballY = y + radius * 0.65;
        const tubeWidth = radius * 0.5;

        // Tube
        ctx.beginPath();
        ctx.moveTo(x - tubeWidth, ballY);
        ctx.lineTo(x + tubeWidth, ballY);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 12;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Center marks
        ctx.beginPath();
        ctx.moveTo(x - 6, ballY - 8);
        ctx.lineTo(x - 6, ballY + 8);
        ctx.moveTo(x + 6, ballY - 8);
        ctx.lineTo(x + 6, ballY + 8);
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Ball position based on slip
        const ballOffset = Math.max(-tubeWidth + 8, Math.min(tubeWidth - 8, slip * 80));
        ctx.beginPath();
        ctx.arc(x + ballOffset, ballY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('TURN COORDINATOR', x, y + radius * 0.4);
    }
}
