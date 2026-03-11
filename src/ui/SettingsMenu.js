import { lodPresets } from '../world/LODSettings.js';

export class SettingsMenu {
    constructor(gameState, onLodChanged = null) {
        this.gameState = gameState;
        this.onLodChanged = onLodChanged;
        this.selectElement = null;
    }

    createSection(title = 'Settings') {
        const section = document.createElement('div');
        section.style.background = 'rgba(255,255,255,0.08)';
        section.style.padding = '14px';
        section.style.borderRadius = '6px';
        section.style.textAlign = 'left';

        const heading = document.createElement('h3');
        heading.textContent = title;
        heading.style.margin = '0 0 10px 0';
        heading.style.fontSize = '1rem';
        heading.style.letterSpacing = '0.05em';
        section.appendChild(heading);

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';

        const label = document.createElement('label');
        label.textContent = 'Terrain Detail';
        label.style.fontSize = '0.92rem';
        label.style.color = '#ddd';

        const select = document.createElement('select');
        select.style.padding = '6px 10px';
        select.style.borderRadius = '4px';
        select.style.border = '1px solid #666';
        select.style.background = '#1f1f1f';
        select.style.color = '#fff';
        select.style.fontSize = '0.92rem';

        lodPresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = `${preset.name} (${preset.segments} seg, ${preset.drawDistance} chunks)`;
            select.appendChild(option);
        });

        select.value = String(this.gameState.settings.lod ?? 1);
        select.addEventListener('change', () => {
            const lodIndex = Number(select.value);
            this.gameState.settings.lod = Number.isFinite(lodIndex) ? lodIndex : 1;
            if (this.onLodChanged) {
                this.onLodChanged(this.gameState.settings.lod);
            }
        });

        row.appendChild(label);
        row.appendChild(select);
        section.appendChild(row);

        this.selectElement = select;
        return section;
    }

    syncFromState() {
        if (!this.selectElement) return;
        this.selectElement.value = String(this.gameState.settings.lod ?? 1);
    }
}
