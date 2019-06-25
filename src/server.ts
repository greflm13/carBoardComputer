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
import * as child from 'child_process';

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
    private _musicInfo = { title: '', artist: '', album: '', playing: false };
    private _musicChild: child.ChildProcess;
    private _isStream: boolean;

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
        res.send(this._musicInfo)
    }

    private next(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this._isStream) {
            this._musicChild.stdin.write('next');
        }
    }

    private prev(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this._isStream) {
            this._musicChild.stdin.write('prev');
        }
    }

    private play(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this._isStream) {
            this._musicChild.stdin.write('play');
        }
    }

    private pause(req: express.Request, res: express.Response, next: express.NextFunction) {
        if (this._isStream) {
            this._musicChild.stdin.write('pause');
        }
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

    private childProcess() {
        this._musicChild = child.spawn('python', ['-u', path.join(__dirname, '../media_control.py')]);
        this._isStream = true;


        this._musicChild.stdout.on('data', (data) => {
            // console.log(`stdout: ${data}`);
            const dataString = data.toString();
            if (dataString.startsWith('Playback Status: ')) {
                this._musicInfo.playing = dataString.substring(17) === 'playing\n' ? true : false;
            }
            if (dataString.includes('Title: ')) {
                this._musicInfo.title = dataString.slice(dataString.indexOf('Title: ') + 7, dataString.indexOf('\n', dataString.indexOf('Title: ') + 7));
            }
            if (dataString.includes('Artist: ')) {
                this._musicInfo.artist = dataString.slice(dataString.indexOf('Artist: ') + 8, dataString.indexOf('\n', dataString.indexOf('Artist: ') + 8));
            }
            if (dataString.includes('Album: ')) {
                this._musicInfo.album = dataString.slice(dataString.indexOf('Album: ') + 6, dataString.indexOf('\n', dataString.indexOf('Album: ') + 6));
            }
        });

        this._musicChild.stderr.on('data', (data) => {
            console.log(data.toString());
            if (data.toString().includes('Media Player not found.')) {
                this.childProcess();
            }
        });

        this._musicChild.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            this._isStream = false;
        });

    }

    public start(port: number): Promise<Server> {
        this.childProcess();

        return new Promise<Server>((resolve, reject) => {
            log.info('Starting Server...');
            const server = http.createServer(this._express).listen(port, () => {
                log.info('Server running on port ' + port + '.');
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