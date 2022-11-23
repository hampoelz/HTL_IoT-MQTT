const clientId = `javascript-mqtt-${getRandomInt(0, 1000)}`;
const topic = 'python/mqtt/#';

const broker = 'broker.emqx.io';
const port = 8083;
const username = 'emqx';
const password = 'public';

document.addEventListener('DOMContentLoaded', () => {
    let tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

    // test smart-lamp element
    const lampContainer = document.querySelector('#lamp-container');
    let lamp1 = document.createElement('smart-lamp');
    let lamp2 = document.createElement('smart-lamp');
    lampContainer.append(lamp1, lamp2);

    lamp1.classList.add('col-sm-4'); 
    lamp1.addEventListener('ready', event => {
        event.target.setName('Test Lampe');
    });

    lamp2.classList.add('col-sm-4');
    lamp2.addEventListener('ready', event => {
        event.target.setName('Lampe im Zimmer');
        event.target.setColor('#0064FF');
    });

    // test mqtt connection 
    const host = `ws://${broker}:${port}/mqtt`
    const options = {
        protocolId: 'MQTT',
        protocolVersion: 4,
        username: username,
        password: password,
        clientId: clientId,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        keepalive: 60,
        clean: true
    }

    const client = mqtt.connect(host, options);

    client.subscribe(topic);
    client.on('message', handleMessage);
});

function handleMessage(topic, payload) {
    //const message = document.querySelector('#message');
    console.log(payload.toString())
    //message.innerHTML = [topic, payload].join(": ");
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
