export class DialRenderer {
    static drawBezel(ctx, x, y, radius, backgroundColor = '#222', borderColor = '#555', borderWidth = 4) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
    }

    static drawTicks(ctx, x, y, radius, tickCount, longTickMod, startAngle, endAngle, tickLengthShort, tickLengthLong, color = '#fff') {
        const range = endAngle - startAngle;
        for (let i = 0; i <= tickCount; i++) {
            const angle = startAngle + (i / tickCount) * range;
            const isLong = i % longTickMod === 0;
            const length = isLong ? tickLengthLong : tickLengthShort;

            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * (radius - length), y + Math.sin(angle) * (radius - length));
            ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            ctx.strokeStyle = color;
            ctx.lineWidth = isLong ? 2 : 1;
            ctx.stroke();
        }
    }

    static drawTextAround(ctx, x, y, radius, tickCount, longTickMod, startAngle, endAngle, getValueFn, fontSize = 12, color = '#fff') {
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const range = endAngle - startAngle;
        for (let i = 0; i <= tickCount; i++) {
            if (i % longTickMod === 0) {
                const angle = startAngle + (i / tickCount) * range;
                const text = getValueFn(i);
                if (text !== null && text !== undefined) {
                    ctx.fillText(text, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
                }
            }
        }
    }

    static drawNeedle(ctx, x, y, radius, angle, color = '#fff', width = 3, tail = 10) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, tail);
        ctx.lineTo(-width, 0);
        ctx.lineTo(0, -radius);
        ctx.lineTo(width, 0);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Center pin
        ctx.beginPath();
        ctx.arc(0, 0, width * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }
}
