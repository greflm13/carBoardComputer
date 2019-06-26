import * as DBus from 'dbus';
import * as child from 'child_process';

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
        let qdbus = null;
        child.execSync('qdbus --system org.bluez').toString().split('\n').forEach((value) => {
            if (value.endsWith('player0')) {
                qdbus = value;
            };
        });
        console.log(qdbus);
        if (qdbus !== null) {
            this.dbus.getInterface('org.bluez', qdbus, 'org.bluez.MediaPlayer1', (err, iface) => {
                if (err) {
                    log.warn(err);
                } else {
                    log.fine('success');
                }
                iface.getProperties((err, properties) => {
                    if (err) {
                        log.warn(err);
                    } else {
                        console.log('properties: ');
                        console.log(properties);
                    }
                });
            });
        }
        else {
            this.main();
        }
    }
}

