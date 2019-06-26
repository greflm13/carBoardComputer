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
        this.dbus.getInterface('org.bluez', '/', 'org.freedesktop.DBus.Properties', (err, interfake) => {
            if (err) {
                log.warn(err);
            }
            interfake.getProperties((err, properties) => {
                if (err) {
                    log.warn(err);
                }
                this._properties = properties;
                console.log(this._properties);
            })
        });
    }
}

