const instanceId = getRandomInt(0, 1000);
const clientId = `javascript-mqtt-${instanceId}`;


const topic_base = "home/lamp/";
const topic_lamps = `${topic_base}#`

const broker = 'broker.emqx.io';
const port = 8083;
const username = 'emqx';
const password = 'public';

document.addEventListener('DOMContentLoaded', () => {
    let tooltipTriggerList = [...document.querySelectorAll('[data-bs-toggle="tooltip"]')];
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el));

    const lampContainer = document.querySelector('#lamp-container');

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

    client.subscribe(topic_lamps, { nl: true });
    client.on('message', handleMessage);

    const lamp_list = {}

    function handleMessage(topic, payload) {
        const lamp_topic = topic.replace(topic_base, "").split("/");
        const lamp_id = lamp_topic[0];

        if (lamp_topic[1] == "command") {
            const command = payload.toString();
            if (command == "") return;

            if (command == "delete") {
                lampContainer.removeChild(lamp_list[lamp_id])
                lamp_list[lamp_id].remove();
                delete lamp_list[lamp_id]
                delete lamp_list[lamp_id + "_sender"]
            }
        }

        if (lamp_topic[1] == "display") {
            const lamp_name = payload.toString();

            if(lamp_name == "") return;

            const lamp_element = document.createElement('smart-lamp');

            lamp_element.classList.add('col-sm-4');
            lamp_element.addEventListener('ready', event => {
                event.target.setName(lamp_name);
            });
            lamp_element.addEventListener('colorchange', event => {
                client.publish(`${topic_base}${lamp_id}/sender`, instanceId.toString())
                client.publish(`${topic_base}${lamp_id}/color`, event.detail.color, { retain: true})
            });
            lamp_element.addEventListener('delete', event => {
                client.publish(`${topic_base}${lamp_id}/command`, "delete")
                client.publish(`${topic_base}${lamp_id}/display`, "", { retain: true})
                client.publish(`${topic_base}${lamp_id}/color`, "", { retain: true})
            });
            lampContainer.appendChild(lamp_element);
            lamp_list[lamp_id] = lamp_element;
        };

        if (lamp_topic[1] == "sender") {
            const sender = payload.toString();
            if(sender == "") return;
            lamp_list[lamp_id + "_sender"] = sender;
        }

        if (lamp_topic[1] == "color") {
            const color_new = payload.toString();
            if(color_new == "") return;

            const sender = lamp_list[lamp_id + "_sender"];
            if (sender == instanceId.toString()) return;

            const lamp_element = lamp_list[lamp_id];
            const color_current = lamp_element.currentColor;
            if (color_current == color_new) return;

            lamp_list[lamp_id].setColor(payload.toString());
        }

        //const message = document.querySelector('#message');
        console.log(topic, payload.toString())
        //message.innerHTML = [topic, payload].join(": ");
    }

    function createLamp() {
        const lamp = document.createElement('smart-lamp');
        lamp.classList.add('col-sm-4');
        lamp.addEventListener('ready', event => {
            console.log("ready")
            event.target.setName(lamp_name);
            event.target.setColor(lamp_color);
        });
    }
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}
