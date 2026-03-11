export class SecondaryInstruments {
    render(ctx, x, y, width, height, gameState) {
        const controls = gameState.controls;
        const aircraft = gameState.aircraft;
        const flags = gameState.flags;

        const padding = 8;
        const rowHeight = 22;
        const colWidth = width;

        // Background panel
        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 6);
        ctx.fill();
        ctx.stroke();

        let curY = y + padding + 4;

        // --- Throttle Gauge ---
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('THROTTLE', x + padding, curY);
        curY += 4;

        const barX = x + padding;
        const barWidth = colWidth - padding * 2;
        const barHeight = 10;

        // Background bar
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, curY, barWidth, barHeight);
        // Fill
        const throttleFill = Math.max(0, Math.min(1, controls.throttle));
        ctx.fillStyle = throttleFill > 0.8 ? '#ff4444' : (throttleFill > 0.5 ? '#ffaa00' : '#44cc44');
        ctx.fillRect(barX, curY, barWidth * throttleFill, barHeight);
        // Border
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, curY, barWidth, barHeight);
        // Percentage text
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.round(throttleFill * 100) + '%', barX + barWidth, curY - 1);

        curY += barHeight + 12;

        // --- Control Surface Indicators ---
        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('CONTROLS', x + padding, curY);
        curY += 6;

        // Elevator (pitch)
        this.drawControlBar(ctx, barX, curY, barWidth, 8, controls.pitch, 'ELEV');
        curY += 20;

        // Aileron (roll)
        this.drawControlBar(ctx, barX, curY, barWidth, 8, controls.roll, 'AIL');
        curY += 20;

        // Rudder (yaw)
        this.drawControlBar(ctx, barX, curY, barWidth, 8, controls.yaw, 'RUD');
        curY += 24;

        // --- Indicator Lights ---
        // Engine
        this.drawIndicatorLight(ctx, x + padding, curY, 'ENGINE', aircraft.engineRunning, '#44cc44', '#442222');
        curY += 20;

        // Stall warning
        this.drawIndicatorLight(ctx, x + padding, curY, 'STALL', flags.stallWarning, '#ff4444', '#331111');
        curY += 20;

        // Brakes
        this.drawIndicatorLight(ctx, x + padding, curY, 'BRAKES', controls.wheelBrake, '#ffaa00', '#332200');
    }

    drawControlBar(ctx, x, y, width, height, value, label) {
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);

        // Center line
        const centerX = x + width / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, y);
        ctx.lineTo(centerX, y + height);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Fill from center
        const clampedVal = Math.max(-1, Math.min(1, value));
        const fillWidth = (clampedVal * width) / 2;
        ctx.fillStyle = '#44aaff';
        if (fillWidth > 0) {
            ctx.fillRect(centerX, y, fillWidth, height);
        } else {
            ctx.fillRect(centerX + fillWidth, y, -fillWidth, height);
        }

        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // Label
        ctx.fillStyle = '#888';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x, y - 2);
    }

    drawIndicatorLight(ctx, x, y, label, isOn, onColor, offColor) {
        // Light circle
        ctx.beginPath();
        ctx.arc(x + 6, y + 5, 6, 0, Math.PI * 2);
        ctx.fillStyle = isOn ? onColor : offColor;
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = isOn ? '#fff' : '#666';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(label, x + 18, y + 9);
    }
}
