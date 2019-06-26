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

    public properties: Properties;

    private dbus = DBus.getBus('system');
    private qdbus: string = null;
    private iface: DBus.DBusInterface = null;

    constructor() {
        this.main();
    }

    private statusLoop() {
        const inter = setInterval(() => {
            if (this.qdbus !== null) {
                this.iface.getProperties((err, properties) => {
                    if (err) {
                        log.warn(err);
                        clearInterval(inter);
                        this.main();
                    } else {
                        this.properties = <Properties><unknown>properties;
                    }
                });
            }
        }, 1000);
    }

    private main() {
        child.execSync('qdbus --system org.bluez').toString().split('\n').forEach((value) => {
            if (value.endsWith('player0')) {
                this.qdbus = value;
                this.dbus.getInterface('org.bluez', this.qdbus, 'org.bluez.MediaPlayer1', (err, iface) => {
                    if (err) {
                        log.warn(err);
                    } else {
                        this.iface = iface;

                    }
                });
                this.statusLoop();
            } else {
                setTimeout(() => { this.main(); }, 5000);
            }
        });
    }

    public async start(): Promise<Bluetooth> {
        log.info('starting Bluetooth service...');
        return new Promise<Bluetooth>((resolve, reject) => {
            log.info('started Bluetooth service.');
        })
    }
}

interface Track {
    Title: string;
    Duration: number;
    Item: string;
    Album: string;
    Artist: string;
    NumberOfTracks: number;
    TrackNumber: number;
}

interface Properties {
    Name: string;
    Type: string;
    Subtype: string;
    Position: number;
    Status: string;
    Track: Track;
    Device: string;
    Browsable: boolean;
    Searchable: boolean;
    Playlist: string;
}
