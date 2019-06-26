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
    public iface: DBus.DBusInterface = null;
    public qdbus: string = null;

    private dbus = DBus.getBus('system');

    constructor() {
        this.main();
    }

    private async main() {
        await child.execSync('qdbus --system org.bluez').toString().split('\n').forEach((value) => {
            if (value.endsWith('player0')) {
                this.qdbus = value;
                this.dbus.getInterface('org.bluez', this.qdbus, 'org.bluez.MediaPlayer1', (err, iface) => {
                    if (err) {
                        log.warn(err);
                    } else {
                        this.iface = iface;
                        log.info('Started Bluetooth service.');
                    }
                });
            }
        });
        if (this.qdbus === null) {
            log.info('No Media Player found. retrying...');
            setTimeout(() => {
                this.retry();
            }, 1000)

        }
    }

    private retry() {
        this.main();
    }

    public async ifaceMethd(): Promise<Properties> {
        if (this.qdbus !== null) {
            await this.iface.getProperties((err, properties) => {
                if (err) {
                    log.warn(err);
                    this.retry();
                } else {
                    this.properties = <Properties><unknown>properties;
                    console.log(this.properties);
                }
            });
            return this.properties;
        }
    }

    public async start(): Promise<Bluetooth> {
        log.info('Starting Bluetooth service...');
        return new Promise<Bluetooth>((resolve, reject) => {
        })
    }
}

export interface Track {
    Title: string;
    Duration: number;
    Item: string;
    Album: string;
    Artist: string;
    NumberOfTracks: number;
    TrackNumber: number;
}

export interface Properties {
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
