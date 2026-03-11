import { SettingsMenu } from './SettingsMenu.js';

export class IntroScreen {
    constructor(gameState, callbacks = {}) {
        this.gameState = gameState;
        this.callbacks = callbacks;
        this.container = document.getElementById('ui-layer');
        this.element = null;

        this.continueButton = null;
        this.hasSave = !!callbacks.hasSave;
        this.settingsMenu = null;
    }

    init() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
        this.element.style.color = '#fff';
        this.element.style.display = 'flex';
        this.element.style.flexDirection = 'column';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.pointerEvents = 'auto';
        this.element.style.zIndex = '400';

        const card = document.createElement('div');
        card.style.textAlign = 'center';
        card.style.maxWidth = '700px';
        card.style.width = '92vw';
        card.style.padding = '20px';
        card.style.boxSizing = 'border-box';

        const title = document.createElement('h1');
        title.textContent = 'Flight Simulator';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '1.3rem';
        card.appendChild(title);

        const controlsBlock = document.createElement('div');
        controlsBlock.style.background = 'rgba(255,255,255,0.1)';
        controlsBlock.style.padding = '20px';
        controlsBlock.style.borderRadius = '8px';
        controlsBlock.style.marginBottom = '18px';
        controlsBlock.style.textAlign = 'left';
        controlsBlock.innerHTML = `
            <h3 style="margin-top: 0; color: #4DA8DA;">Controls</h3>
            <ul style="list-style-type: none; padding: 0; line-height: 1.6; margin: 0;">
                <li><strong>W / S:</strong> Pitch (Nose Down / Up)</li>
                <li><strong>A / D:</strong> Roll (Bank Left / Right)</li>
                <li><strong>Q / E:</strong> Yaw (Rudder Left / Right)</li>
                <li><strong>R / F:</strong> Throttle Up / Down</li>
                <li><strong>B:</strong> Wheel Brake</li>
                <li><strong>G:</strong> Engine Start / Stop</li>
                <li><strong>1 / 2:</strong> View Selector (Cockpit / Chase)</li>
                <li><strong>M:</strong> Map View  &nbsp;|&nbsp;  <strong>P:</strong> Pause</li>
            </ul>
        `;
        card.appendChild(controlsBlock);

        this.settingsMenu = new SettingsMenu(this.gameState, this.callbacks.onLodChanged);
        card.appendChild(this.settingsMenu.createSection('Settings'));

        const buttonRow = document.createElement('div');
        buttonRow.style.display = 'flex';
        buttonRow.style.gap = '10px';
        buttonRow.style.marginTop = '18px';
        buttonRow.style.flexWrap = 'wrap';
        buttonRow.style.justifyContent = 'center';

        const startButton = this._makeButton('Start New Flight');
        this.continueButton = this._makeButton('Continue Last Flight');
        const resetWorldButton = this._makeButton('Reset World');
        resetWorldButton.style.background = '#8b1e3f';

        startButton.addEventListener('click', () => {
            if (this.callbacks.onStartNew) this.callbacks.onStartNew();
        });

        this.continueButton.addEventListener('click', () => {
            if (!this.hasSave) return;
            if (this.callbacks.onContinue) this.callbacks.onContinue();
        });

        resetWorldButton.addEventListener('click', () => {
            if (this.callbacks.onResetWorld) this.callbacks.onResetWorld();
        });

        buttonRow.appendChild(startButton);
        buttonRow.appendChild(this.continueButton);
        buttonRow.appendChild(resetWorldButton);
        card.appendChild(buttonRow);

        const githubLink = document.createElement('a');
        githubLink.href = 'https://github.com/jonnyleigh/flight-simulator';
        githubLink.target = '_blank';
        githubLink.rel = 'noopener noreferrer';
        githubLink.textContent = 'github.com/jonnyleigh/flight-simulator';
        githubLink.style.display = 'block';
        githubLink.style.marginTop = '18px';
        githubLink.style.color = '#4DA8DA';
        githubLink.style.fontSize = '0.85rem';
        githubLink.style.textDecoration = 'none';
        githubLink.addEventListener('mouseenter', () => githubLink.style.textDecoration = 'underline');
        githubLink.addEventListener('mouseleave', () => githubLink.style.textDecoration = 'none');
        card.appendChild(githubLink);

        this.element.appendChild(card);
        this.container.appendChild(this.element);

        this.setHasSave(this.hasSave);
    }

    setHasSave(hasSave) {
        this.hasSave = !!hasSave;
        if (!this.continueButton) return;

        this.continueButton.disabled = !this.hasSave;
        this.continueButton.style.opacity = this.hasSave ? '1' : '0.5';
        this.continueButton.style.cursor = this.hasSave ? 'pointer' : 'not-allowed';
    }

    show() {
        if (this.element) {
            this.settingsMenu?.syncFromState();
            this.element.style.display = 'flex';
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
        }
    }

    _makeButton(label) {
        const button = document.createElement('button');
        button.textContent = label;
        button.style.padding = '12px 18px';
        button.style.fontSize = '1rem';
        button.style.background = '#1f6feb';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.minWidth = '170px';
        return button;
    }
}
