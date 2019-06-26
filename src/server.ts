process.env['DEBUG'] = '*::INFO, *::WARN, *::ERR, *::SEVERE, *::';
process.env['DEBUG_COLORS'] = 'true';
process.env['DEBUG_STREAM'] = 'stdout';

import * as express from 'express';
import * as path from 'path';
import * as bodyparser from 'body-parser';
import * as http from 'http';
import * as fs from 'fs';
import * as requestLanguage from 'express-request-language';
import * as debugsx from 'debug-sx';

import { Bluetooth, Properties } from './dbus';

const date = new Date();
export const log: debugsx.IFullLogger = debugsx.createFullLogger('Homepage');
const consolelogger: debugsx.IHandler = debugsx.createConsoleHandler('stdout', '*::INFO, *::FINE, *::SEVERE, *::ERR, *::WARN', '-*', [
    { level: 'INFO', color: 'green', inverse: true },
    { level: 'FINE', color: 'white', inverse: true },
    { level: 'SEVERE', color: 'black', inverse: true },
    { level: 'ERR', color: 'red', inverse: true },
    { level: 'WARN', color: 'yellow', inverse: true }
]);
let filelogger: debugsx.IHandler;
filelogger = debugsx.createFileHandler(
    path.join(__dirname, '..') +
    '/log/' +
    'server_' +
    date.getDate() +
    '-' +
    date.getMonth() +
    '-' +
    date.getFullYear() +
    '_' +
    date.getHours() +
    '.' +
    date.getMinutes() +
    '.' +
    date.getSeconds() +
    '.log',
    '*::INFO, *::FINE, *::SEVERE, *::ERR, *::WARN',
    '-*',
    [
        { level: 'INFO', color: 'green', inverse: true },
        { level: 'FINE', color: 'white', inverse: true },
        { level: 'SEVERE', color: 'black', inverse: true },
        { level: 'ERR', color: 'red', inverse: true },
        { level: 'WARN', color: 'yellow', inverse: true }
    ]
);
debugsx.addHandler(filelogger, consolelogger);

export class Server {
    // #region Singleton

    private static _instance: Server;

    public static get Instance(): Server {
        if (Server._instance === undefined) {
            Server._instance = new Server();
        }
        return Server._instance;
    }

    // #endregion

    private _express = express();
    private properties: Properties;

    private constructor() {
        this._express.use(bodyparser.json({ limit: '1mb' }));
        this._express.use(bodyparser.urlencoded({ limit: '1mb', extended: true }));
        this._express.use(requestLanguage({ languages: ['en-GB', 'en-US', 'de-DE', 'de-AT'] }));
        this._express.set('views', path.join(__dirname, '/views'));
        const pugEngine = this._express.set('view engine', 'pug');
        pugEngine.locals.pretty = true;
        this._express.use((req, res, next) => this.logger(req, res, next, 'Main'));

        // Modules
        this._express.use((req, res, next) => {
            res.set('X-Clacks-Overhead', 'GNU Terry Pratchett');
            next();
        });
        // Main
        this._express.use(express.static(path.join(__dirname, '../client/dist/client')));
        this._express.get('*.php', (req, res, next) => {
            res.sendFile(path.join(__dirname, '/views/no.html'));
        });
        this._express.get('/api/info', (req, res, next) => this.getMusicInfo(req, res, next));
        this._express.post('/api/next', (req, res, next) => this.next(req, res, next));
        this._express.post('/api/prev', (req, res, next) => this.prev(req, res, next));
        this._express.post('/api/play', (req, res, next) => this.play(req, res, next));
        this._express.post('/api/pause', (req, res, next) => this.pause(req, res, next));
        this._express.use(express.static(path.join(__dirname, './public')));
        this._express.use(this.error404Handler);
        this._express.use(this.errorHandler);
    }

    private getMusicInfo(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (Bluetooth.Instance.qdbus !== null) {
            Bluetooth.Instance.iface.getProperties((err, properties) => {
                if (err) {
                    log.warn(err);
                    Bluetooth.Instance.retry();
                } else {
                    this.properties = <Properties><unknown>properties;
                    console.log(this.properties);
                }
            });
        }
    }

    private next(req: express.Request, res: express.Response, next: express.NextFunction) {
        Bluetooth.Instance.iface.Next();
    }

    private prev(req: express.Request, res: express.Response, next: express.NextFunction) {
        Bluetooth.Instance.iface.Previous();
    }

    private play(req: express.Request, res: express.Response, next: express.NextFunction) {
        Bluetooth.Instance.iface.Play();
    }

    private pause(req: express.Request, res: express.Response, next: express.NextFunction) {
        Bluetooth.Instance.iface.Pause();
    }

    private error404Handler(req: express.Request, res: express.Response, next: express.NextFunction) {
        const clientSocket = req.socket.remoteAddress + ':' + req.socket.remotePort;
        log.warn('Error 404 for %s %s from %s', req.method, req.url, clientSocket);
        res.status(404).sendFile(path.join(__dirname, './views/error404.html'));
    }

    private errorHandler(err: express.Errback, req: express.Request, res: express.Response, next: express.NextFunction) {
        const ts = new Date().toLocaleString();
        if (err.toString().startsWith('Error: ENOENT')) {
            res.sendFile(path.join(__dirname, './views/update.html'));
            log.warn('Update deploying...');
        } else {
            log.severe('Error %s\n%e', ts, err);
            res.status(500).render('error500.pug', {
                time: ts,
                err: err,
                href:
                    'mailto:sorogon.developer@gmail.com?subject=Server failed;&body=https://www.sorogon.eu/ failed at ' + ts + ' with Error: ' + err,
                serveradmin: 'Florian Greistorfer'
            });
            process.abort();
        }
    }

    private logger(req: express.Request, res: express.Response, next: express.NextFunction, server: string) {
        const clientSocket = req.socket.remoteAddress + ':' + req.socket.remotePort;
        log.info(server + ':', req.method, req.url, clientSocket);
        next();
    }

    public start(port: number): Promise<Server> {

        return new Promise<Server>((resolve, reject) => {
            log.info('Starting Server...');
            const server = http.createServer(this._express).listen(port, () => {
                log.info('Server running on port ' + port + '.');
                Bluetooth.Instance.start();
                server.on('close', () => {
                    log.fine('Server stopped.');
                });
                server.on('err', err => {
                    log.warn(err);
                });
            });
        });
    }
}