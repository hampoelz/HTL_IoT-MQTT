import os
import random
import time
import threading
from rich.console import Console
from paho.mqtt import client as mqtt_client

console = Console()

client_id = f'home_lamp-{random.randint(0, 1000)}'

topic_base = "home/lamp/"

broker = 'mqtt.eclipseprojects.io'
port = 1883
username = ''
password = ''

def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc != 0:
            print("Failed to connect, return code %d\n", rc)
    # Set Connecting Client ID
    client = mqtt_client.Client(client_id)
    client.username_pw_set(username, password)
    client.on_connect = on_connect
    client.connect(broker, port)
    return client

def hex_to_rgb(hex):
    # hex color: "#512a63"
    #              | | |
    # char index:  1 2 3
    return tuple(int(hex[i:i+2], 16) for i in (1, 3, 5))

def rgb_brightness(rgb):
    [r, g, b] = map(lambda c: c / 255, rgb)
    return max(r, g, b)

lamp_exist = False
lamp_color = "#0277BD" # default color

def visualize():
    rgb = hex_to_rgb(lamp_color)
    brightness = round(rgb_brightness(rgb) * 100)
    brightnessHex = "{:02x}".format(round(rgb_brightness(rgb) * 255))
    
    print('\033[5A\033[2K', end='')
    console.print("---- Lamp Visualization ----")
    if brightness <= 0:
        console.print(f"Lamp Power: Off", style="red")
    else:
        console.print(f"Lamp Power: On ", style="green")
    console.print(f"Lamp Color: {lamp_color}", style=lamp_color)
    console.print(f"Brightness: {str(brightness).rjust(3)}%", style=f"#{brightnessHex}{brightnessHex}{brightnessHex}")
    console.print("----------------------------")

def create_lamp(client):
    lamp_name = input("Name the lamp: ") # e.g. 'Lampe im Zimmer' 
    lamp_id = lamp_name.replace(' ', '_').lower() # 'Lampe im Zimmer' --> 'lampe_im_zimmer'

    topic_display = topic_base + lamp_id + "/display"
    topic_color = topic_base + lamp_id + "/color"
    topic_command = topic_base + lamp_id + "/command"

    client.subscribe(topic_display)
    client.subscribe(topic_color)
    client.subscribe(topic_command)

    def check_lamp():
        if not lamp_exist:
            client.publish(topic_display, lamp_name, retain=True)
            client.publish(topic_color, lamp_color, retain=True)
            console.clear()
            visualize()
    
    console.print("Wait 2s to register the lamp ...")

    def on_message(client, data, msg):
        if msg.topic == topic_display:
            global lamp_exist
            lamp_exist = True
            console.clear()
        if msg.topic == topic_color:
            global lamp_color
            lamp_color = msg.payload.decode()
            visualize()
        if msg.topic == topic_command:
            if msg.payload.decode() == "delete":
                console.clear()
                print("The lamp has been deleted!")
                os._exit(0)

    client.on_message = on_message
    threading.Timer(2, check_lamp).start()

def main():
    client = connect_mqtt()
    client.loop_start()
    create_lamp(client)
    while True: time.sleep(0.1)

if __name__ == '__main__':
    main()