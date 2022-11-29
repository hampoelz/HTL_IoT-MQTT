document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('devices/smart-lamp.html')
    const data = await response.text();

    // TODO: Check if lamp is initialized in methods
    class SmartLamp extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            if (this._initialized) return;
            this._initialized = true;

            this.innerHTML = data;

            this._element = {
                card: this.querySelector(".smart-lamp-card"),
                modal: this.querySelector(".smart-lamp-modal"),
                modalIcon: this.querySelector(".smart-lamp-modal-icon"),
                picker: this.querySelector(".smart-lamp-modal-color"),
                powerToggleOn: this.querySelector(".smart-lamp-powertoggle-on"),
                powerToggleOff: this.querySelector(".smart-lamp-powertoggle-off"),
                powerToggleLabelOn: this.querySelector(".smart-lamp-powertoggle-label-on"),
                powerToggleLabelOff: this.querySelector(".smart-lamp-powertoggle-label-off"),
                delete: this.querySelector(".smart-lamp-delete"),
                state: this.querySelector(".smart-lamp-state"),
                color: this.querySelector(".smart-lamp-color"),
                icon: this.querySelector(".smart-lamp-icon"),
                brightnessBarWrapper: this.querySelector(".smart-lamp-brightness"),
                brightnessBarProgress: this.querySelector(".smart-lamp-brightness .progress-bar"),
            }

            this._elements = {
                name: this.querySelectorAll(".smart-lamp-name"),
            }

            const self = this;

            const lampId = getRandomInt(0, 1000)
            const modalId = `smart-lamp-modal-${lampId}`;
            const powerToggleId = `smart-lamp-powerToggle-${lampId}`;

            this._element.modal.id = modalId;
            this._element.card.setAttribute('data-bs-target', `#${modalId}`);

            this._element.powerToggleOn.id = `${powerToggleId}-on`;
            this._element.powerToggleOn.setAttribute('name', powerToggleId);
            this._element.powerToggleLabelOn.setAttribute('for', `${powerToggleId}-on`);

            this._element.powerToggleOff.id = `${powerToggleId}-off`;
            this._element.powerToggleOff.setAttribute('name', powerToggleId);
            this._element.powerToggleLabelOff.setAttribute('for', `${powerToggleId}-off`);

            this._element.powerToggleOn.addEventListener('click', () => powerToggle(true))
            this._element.powerToggleOff.addEventListener('click', () => powerToggle(false))

            this._element.delete.addEventListener('click', () => {
                self.dispatchEvent(new Event("delete"));
            });

            this._element.state.innerHTML = "Initialisieren";

            this._picker = Pickr.create({
                el: this._element.picker,
                theme: 'classic',
                showAlways: true,
                inline: true,
                lockOpacity: true,

                components: {
                    preview: true,
                    hue: true,
                    opacity: true,
                    interaction: {
                        hex: true,
                        rgba: true,
                        hsla: true,
                        hsva: true,
                        cmyk: true,
                        input: true,
                    }
                }
            });

            this._picker.on('change', (color, source) => {
                self.currentColor = color.toHEXA().toString();
                self.setPreviewColor(self.currentColor);

                if (source == "slider" || source == "input") sendChangeEvent("color");
            });

            this._picker.on('init', () => {
                if (self.currentColor) self.setColor(self.currentColor);
            });

            const powerToggle = toggleOn => {
                const hsv = this._picker.getColor();
                hsv.v = toggleOn ? 100 : 0;
                this._picker.setColor(hsv.toHSVA().toString());
                sendChangeEvent("color");
            }

            function sendChangeEvent(scope) {
                if (!scope) return;

                const event = new CustomEvent("propertychange", {
                    bubbles: true,
                    detail: { scope: scope, value: self.currentColor }
                });

                self.dispatchEvent(event);
            }

            this.setBrightnessBar(0)

            this.dispatchEvent(new Event("ready"));
        }

        setName(name) {
            this._elements.name.forEach(el => el.innerHTML = name);
        }

        setColor(hexColor) {
            this.currentColor = hexColor;

            if (this._picker._initializingActive) this.setPreviewColor(hexColor);
            else this._picker.setColor(hexColor);
        }

        setPreviewColor(hexColor) {
            let color = hexToColor(hexColor);
            if (color == 'white' || color == 'gray') color = 'muted-lt';

            const colorClass = 'bg-' + color;

            const prevColorClasses = [...this._element.color.classList].filter(c => c.startsWith('bg-'))

            const rgbColor = hexToRgb(hexColor);

            const colorBrightness = rgbBrightness(rgbColor) * 100;
            const colorBrightnessOff = 10;

            this.setBrightnessBar(colorBrightness);

            // Toggle lamp UI on/off
            if (colorBrightness <= colorBrightnessOff) {
                this._element.color.classList.remove(...prevColorClasses, 'text-white');
                this._element.color.classList.add('bg-transparent');

                this._element.icon.classList.remove('ti-bulb')
                this._element.icon.classList.add('ti-bulb-off')
                this._element.modalIcon.classList.remove('ti-bulb')
                this._element.modalIcon.classList.add('ti-bulb-off')

                this._element.state.innerHTML = "Off";

                this._element.powerToggleOn.checked = false;
                this._element.powerToggleOff.checked = true;

                this.setBrightnessBar(0);
                return;
            } else {
                this._element.color.classList.remove('bg-transparent');
                this._element.color.classList.add('text-white');

                this._element.icon.classList.remove('ti-bulb-off')
                this._element.icon.classList.add('ti-bulb')
                this._element.modalIcon.classList.remove('ti-bulb-off')
                this._element.modalIcon.classList.add('ti-bulb')

                this._element.state.innerHTML = "On";

                this._element.powerToggleOn.checked = true;
                this._element.powerToggleOff.checked = false;
            }

            if (prevColorClasses.includes(colorClass)) return;

            this._element.color.classList.remove(...prevColorClasses)
            this._element.color.classList.add(colorClass);
        }

        setBrightnessBar(brightness) {
            brightness = Math.round(brightness)
            const description = `${brightness}% Helligkeit`;

            this._element.brightnessBarWrapper.title = description;

            this._element.brightnessBarProgress.style.width = `${brightness}%`;
            this._element.brightnessBarProgress.setAttribute('aria-valuenow', brightness);
            this._element.brightnessBarProgress.setAttribute('aria-label', description);

            new bootstrap.Tooltip(this._element.brightnessBarWrapper);
        }
    }

    customElements.define("smart-lamp", SmartLamp);
});

const colorNames = ['blue', 'azure', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'muted']

const variables = getComputedStyle(document.documentElement);
const getColorFromVariable = color => variables.getPropertyValue(`--tblr-${color}-rgb`).split(',').map(c => parseInt(c));
const getLightColorFromVariable = color => getColorFromVariable(color).map(c => c + (255 - c) * 0.1);

const colorsClasses = colorNames.reduce((prev, color) => ({ ...prev, [color]: getColorFromVariable(color), [color + '-lt']: getLightColorFromVariable(color) }), {})
const colors = { ...colorsClasses, white: [255, 255, 255], gray: [128, 128, 128], /* black: [0, 0, 0] */ }

function hexToColor(hex) {
    const rgb = hexToRgb(hex);
    const color = getClosestColor(rgb);
    return color;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function rgbBrightness(color) {
    [r, g, b] = color.map(c => c /= 255);
    let v = Math.max(r, g, b);
    return v;
}

function getColorDistance(color1, color2) {
    const [r1, g1, b1] = color1;
    const [r2, g2, b2] = color2;
    return (r1 - r2) * (r1 - r2) + (g1 - g2) * (g1 - g2) + (b1 - b2) * (b1 - b2);
};

function getClosestColor(givenColor) {
    let closestDistance = null;
    let closestColor = [];

    for (let color in colors) {
        const distance = getColorDistance(colors[color], givenColor);
        if (closestDistance === null || distance < closestDistance) {
            closestDistance = distance;
            closestColor = [color];
        } else if (closestDistance === distance) {
            closestColor.push(color);
        }
    }

    return closestColor[0];
}