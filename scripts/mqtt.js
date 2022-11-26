// MQTT Connection Configuartion
const broker = 'broker.emqx.io';
const port = 8083;
const username = 'emqx';
const password = 'public';

const instanceId = getRandomInt(0, 1000);
const clientId = `home_interface-${instanceId}`;

const topicRoot = "home"

const topic_base = "home/lamp/";
const topic_lamps = `${topic_base}#`

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

    // connection faild

    const lampContainer = document.querySelector('#lamp-container');
    const lampPlaceholder = document.querySelector('#smart-lamp-placeholder');

    registerDeviceTree(client, `${topicRoot}/lamp`, "smart-lamp", lampContainer, instanceId.toString(), onLampRegister, onLampChange, onLampRemove);

    function onLampRegister(element, id) {
        const deviceTopic = `${topicRoot}/lamp/${id}`
        element.addEventListener('propertychange', event => {
            switch (event.detail.scope) {
                case 'color':
                    client.publish(`${deviceTopic}/color`, event.detail.value, { retain: true });
                    break;
            }
        });

        if (lampPlaceholder) lampPlaceholder.remove();
    }

    function onLampChange(action, value, element) {
        switch (action) {
            case 'color':
                if (element.currentColor == value) return;
                element.setColor(value);
                break;
        }
    }

    function onLampRemove() {
        if (lampContainer.childElementCount <= 0)
            lampContainer.appendChild(lampPlaceholder);
    }
});


function registerDeviceTree(client, topicBase, elementTemplate, elementContainer, senderId, registerCallback, changeCallback, removeCallback) {
    const deviceList = {}

    client.subscribe(`${topicBase}/#`);
    client.on('message', (topic, payload) => {
        // topic:       /home/lamp/test_lamp/display
        // sections:    |--------|/|---------------|
        //              topicBase    device topic
        //              |---|/|--|/|-------|/|-----|
        //              root device deviceId action
        const deviceTopic = topic.replace(topicBase, "").split("/").filter(Boolean);
        const deviceId = deviceTopic[0];
        const action = deviceTopic[1];
        const value = payload.toString();

        if (value == "") return;

        switch (action) {
            case 'command':
                if (!deviceList[deviceId]) return;
                if (value == "delete") {
                    elementContainer.removeChild(deviceList[deviceId]);
                    deviceList[deviceId].remove();
                    delete deviceList[deviceId];
                    delete deviceList[deviceId + "_sender"];
                    removeCallback(deviceId);
                }
                break;
            case 'display':
                if (deviceList[deviceId]) return;

                const deviceElement = document.createElement(elementTemplate);
                deviceElement.classList.add('col-sm-4');

                deviceElement.addEventListener('ready', () => {
                    deviceElement.setName(value);
                });

                deviceElement.addEventListener('delete', () => {
                    client.publish(`${topicBase}/${deviceId}/command`, "delete");
                    client.publish(`${topicBase}/${deviceId}/display`, "", { retain: true });
                });

                deviceElement.addEventListener('propertychange', () => {
                    client.publish(`${topicBase}/${deviceId}/sender`, senderId);
                });

                elementContainer.appendChild(deviceElement);
                deviceList[deviceId] = deviceElement;
                registerCallback(deviceList[deviceId], deviceId);
                break;
            case 'sender':
                if (!deviceList[deviceId]) return;
                deviceList[deviceId + "_sender"] = value;
                break;
            default:
                const sender = deviceList[deviceId + "_sender"];
                if (sender == senderId || !deviceList[deviceId]) return;
                changeCallback(action, value, deviceList[deviceId], deviceId);
        }
    });
}