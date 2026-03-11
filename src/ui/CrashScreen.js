export class CrashScreen {
    constructor(onReset) {
        this.onReset = onReset;
        this.container = document.getElementById('ui-layer');
        this.element = null;
    }

    init() {
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(90, 90, 90, 0.82)';
        this.element.style.color = '#fff';
        this.element.style.display = 'none';
        this.element.style.alignItems = 'center';
        this.element.style.justifyContent = 'center';
        this.element.style.pointerEvents = 'auto';
        this.element.style.zIndex = '500';

        const card = document.createElement('div');
        card.style.textAlign = 'center';
        card.style.padding = '24px';
        card.style.background = 'rgba(15, 15, 15, 0.85)';
        card.style.borderRadius = '8px';
        card.style.border = '1px solid #555';

        const title = document.createElement('h1');
        title.textContent = 'CRASHED';
        title.style.margin = '0 0 8px 0';
        title.style.fontSize = '3.2rem';
        title.style.letterSpacing = '0.12em';
        card.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Impact with terrain or water detected.';
        subtitle.style.margin = '0 0 18px 0';
        subtitle.style.color = '#ddd';
        card.appendChild(subtitle);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset Flight';
        resetBtn.style.padding = '10px 18px';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '5px';
        resetBtn.style.background = '#1f6feb';
        resetBtn.style.color = '#fff';
        resetBtn.style.fontSize = '1rem';
        resetBtn.style.cursor = 'pointer';
        resetBtn.addEventListener('click', () => {
            if (this.onReset) this.onReset();
        });

        card.appendChild(resetBtn);
        this.element.appendChild(card);
        this.container.appendChild(this.element);
    }

    show() {
        if (!this.element) return;
        this.element.style.display = 'flex';
    }

    hide() {
        if (!this.element) return;
        this.element.style.display = 'none';
    }
}
