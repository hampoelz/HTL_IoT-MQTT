const clientId = `javascript-mqtt-${getRandomInt(0, 1000)}`;
const topic = 'python/mqtt';

const broker = 'broker.emqx.io';
const port = 8083;
const username = 'emqx';
const password = 'public';

document.addEventListener('DOMContentLoaded', () => {
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
    const message = document.querySelector('#message');
    message.innerHTML = [topic, payload].join(": ");
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}