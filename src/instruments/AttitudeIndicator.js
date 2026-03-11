export class AttitudeIndicator {
    render(ctx, x, y, radius, pitchRad, rollRad) {
        const pitchDeg = pitchRad * (180 / Math.PI);
        const rollDeg = rollRad * (180 / Math.PI);

        ctx.save();

        // Clip to circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();

        // Draw sky and ground with pitch and roll applied
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rollRad);

        // Pitch offset - each degree = a fixed number of pixels
        const pixPerDeg = radius / 25; // 25 degrees fills the instrument
        const pitchOffset = pitchDeg * pixPerDeg;

        // Sky
        ctx.fillStyle = '#3388dd';
        ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 2 + pitchOffset);

        // Ground (brown)
        ctx.fillStyle = '#885522';
        ctx.fillRect(-radius * 2, pitchOffset, radius * 4, radius * 2);

        // Horizon line
        ctx.beginPath();
        ctx.moveTo(-radius * 2, pitchOffset);
        ctx.lineTo(radius * 2, pitchOffset);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pitch ladder lines
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let deg = -20; deg <= 20; deg += 5) {
            if (deg === 0) continue;
            const yPos = pitchOffset - deg * pixPerDeg;
            const halfWidth = deg % 10 === 0 ? radius * 0.3 : radius * 0.15;

            ctx.beginPath();
            ctx.moveTo(-halfWidth, yPos);
            ctx.lineTo(halfWidth, yPos);
            ctx.lineWidth = deg % 10 === 0 ? 2 : 1;
            ctx.stroke();

            if (deg % 10 === 0) {
                ctx.fillText(Math.abs(deg).toString(), -halfWidth - 14, yPos);
                ctx.fillText(Math.abs(deg).toString(), halfWidth + 14, yPos);
            }
        }

        ctx.restore();

        // Fixed aircraft symbol (orange wings with center dot)
        ctx.beginPath();
        ctx.moveTo(x - radius * 0.35, y);
        ctx.lineTo(x - radius * 0.12, y);
        ctx.lineTo(x - radius * 0.12, y + radius * 0.06);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + radius * 0.35, y);
        ctx.lineTo(x + radius * 0.12, y);
        ctx.lineTo(x + radius * 0.12, y + radius * 0.06);
        ctx.strokeStyle = '#ff8800';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff8800';
        ctx.fill();

        // Roll indicator triangle at top
        ctx.save();
        ctx.translate(x, y);
        const triSize = radius * 0.08;
        ctx.beginPath();
        ctx.moveTo(0, -radius + 2);
        ctx.lineTo(-triSize, -radius + triSize * 2 + 2);
        ctx.lineTo(triSize, -radius + triSize * 2 + 2);
        ctx.closePath();
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();

        // Bank angle tick marks
        ctx.save();
        ctx.translate(x, y);
        const bankAngles = [10, 20, 30, 45, 60];
        bankAngles.forEach(deg => {
            const rad = deg * Math.PI / 180;
            [-1, 1].forEach(dir => {
                const a = -Math.PI / 2 + rad * dir;
                const len = deg % 30 === 0 ? 12 : 6;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * (radius - len), Math.sin(a) * (radius - len));
                ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        });
        ctx.restore();

        ctx.restore();

        // Outer bezel
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.stroke();
    }
}
