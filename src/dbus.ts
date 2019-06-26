import * as DBus from 'dbus';

import { log } from './server';


export class Bluetooth {

    private static _instance: Bluetooth;

    public static get Instance(): Bluetooth {
        if (Bluetooth._instance === undefined) {
            Bluetooth._instance = new Bluetooth();
        }
        return Bluetooth._instance;
    }

    private _properties: { [name: string]: any; }[];

    private dbus = DBus.getBus('system');

    public main() {
        this.dbus.getInterface('org.bluez', '/org/bluez/hci0/dev_94_65_2D_7B_90_8E/player0', 'org.bluez.MediaPlayer1', (err, interfake) => {
            if (err) {
                log.warn(err);
            } else {
                log.fine('success');
            }
            console.log(interfake);
            // interfake.getProperty('org.bluez.MediaPlayer1', (err, name) => {
            //     if (err) {
            //         log.warn(err);
            //         this.main();
            //     }
            //     console.log(name);
            // })
        });
    }
}

