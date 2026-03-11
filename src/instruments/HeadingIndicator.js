export class HeadingIndicator {
    render(ctx, x, y, radius, headingRad) {
        const headingDeg = ((headingRad * 180 / Math.PI) % 360 + 360) % 360;

        // Background
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#666';
        ctx.stroke();

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius - 4, 0, Math.PI * 2);
        ctx.clip();

        // Rotating compass rose
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-headingRad);

        const innerRadius = radius - 8;

        // Draw tick marks around the circle
        for (let deg = 0; deg < 360; deg += 5) {
            const rad = (deg - 90) * Math.PI / 180;
            const isMajor = deg % 30 === 0;
            const isMedium = deg % 10 === 0;
            const len = isMajor ? 16 : (isMedium ? 10 : 6);

            ctx.beginPath();
            ctx.moveTo(Math.cos(rad) * (innerRadius - len), Math.sin(rad) * (innerRadius - len));
            ctx.lineTo(Math.cos(rad) * innerRadius, Math.sin(rad) * innerRadius);
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.stroke();
        }

        // Cardinal and intercardinal labels
        const labels = {
            0: 'N', 30: '3', 60: '6', 90: 'E',
            120: '12', 150: '15', 180: 'S', 210: '21',
            240: '24', 270: 'W', 300: '30', 330: '33'
        };
        const labelRadius = innerRadius - 24;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        Object.entries(labels).forEach(([deg, label]) => {
            const rad = (parseInt(deg) - 90) * Math.PI / 180;
            const isCardinal = ['N', 'S', 'E', 'W'].includes(label);
            ctx.fillStyle = label === 'N' ? '#ff4444' : (isCardinal ? '#fff' : '#ccc');
            ctx.font = `bold ${Math.floor(radius * (isCardinal ? 0.2 : 0.16))}px sans-serif`;
            ctx.fillText(label, Math.cos(rad) * labelRadius, Math.sin(rad) * labelRadius);
        });

        ctx.restore(); // End rotation
        ctx.restore(); // End clip

        // Fixed heading marker triangle at top
        ctx.beginPath();
        ctx.moveTo(x, y - radius + 2);
        ctx.lineTo(x - 8, y - radius + 14);
        ctx.lineTo(x + 8, y - radius + 14);
        ctx.closePath();
        ctx.fillStyle = '#ff8800';
        ctx.fill();

        // Heading readout
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.floor(radius * 0.18)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(headingDeg).toString().padStart(3, '0') + '°', x, y + radius * 0.55);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = `${Math.floor(radius * 0.12)}px sans-serif`;
        ctx.fillText('HDG', x, y + radius * 0.72);
    }
}
