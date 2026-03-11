import { SettingsMenu } from './SettingsMenu.js';

export class PauseMenu {
    constructor(gameState, callbacks = {}) {
        this.gameState = gameState;
        this.callbacks = callbacks;

        this.container = document.getElementById('ui-layer');
        this.element = null;
        this.settingsMenu = null;
    }

    init() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.element.style.color = '#fff';
        this.element.style.display = 'none';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.pointerEvents = 'auto';
        this.element.style.zIndex = '250';

        const card = document.createElement('div');
        card.style.width = 'min(460px, 90vw)';
        card.style.background = 'rgba(20, 20, 20, 0.95)';
        card.style.border = '1px solid #444';
        card.style.borderRadius = '8px';
        card.style.padding = '24px';
        card.style.boxSizing = 'border-box';
        card.style.textAlign = 'center';

        const title = document.createElement('h2');
        title.textContent = 'Paused';
        title.style.margin = '0 0 16px 0';
        title.style.fontSize = '2rem';
        title.style.letterSpacing = '0.08em';
        card.appendChild(title);

        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '10px';
        buttonRow.style.justifyContent = 'center';
        buttonRow.style.flexWrap = 'wrap';
        buttonRow.style.marginBottom = '16px';

        const resumeBtn = this._makeButton('Resume');
        const resetBtn = this._makeButton('Reset Flight');

        resumeBtn.addEventListener('click', () => {
            if (this.callbacks.onResume) this.callbacks.onResume();
        });

        resetBtn.addEventListener('click', () => {
            if (this.callbacks.onResetFlight) this.callbacks.onResetFlight();
        });

        buttonRow.appendChild(resumeBtn);
        buttonRow.appendChild(resetBtn);
        card.appendChild(buttonRow);

        this.settingsMenu = new SettingsMenu(this.gameState, this.callbacks.onLodChanged);
        card.appendChild(this.settingsMenu.createSection('Settings'));

        const hint = document.createElement('p');
        hint.textContent = 'Press P to resume';
        hint.style.margin = '12px 0 0 0';
        hint.style.color = '#bbb';
        hint.style.fontSize = '0.9rem';
        card.appendChild(hint);

        this.element.appendChild(card);
        this.container.appendChild(this.element);
    }

    show() {
        if (!this.element) return;
        this.settingsMenu?.syncFromState();
        this.element.style.display = 'flex';
    }

    hide() {
        if (!this.element) return;
        this.element.style.display = 'none';
    }

    _makeButton(label) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.padding = '10px 16px';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.fontSize = '1rem';
        button.style.cursor = 'pointer';
        button.style.background = '#1f6feb';
        button.style.color = '#fff';
        button.style.minWidth = '140px';
        return button;
    }
}
