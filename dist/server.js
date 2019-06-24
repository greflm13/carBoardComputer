"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env['DEBUG'] = '*::INFO, *::WARN, *::ERR, *::SEVERE, *::';
process.env['DEBUG_COLORS'] = 'true';
process.env['DEBUG_STREAM'] = 'stdout';
const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const http = require("http");
const requestLanguage = require("express-request-language");
const debugsx = require("debug-sx");
const child = require("child_process");
const date = new Date();
exports.log = debugsx.createFullLogger('Homepage');
const consolelogger = debugsx.createConsoleHandler('stdout', '*::INFO, *::FINE, *::SEVERE, *::ERR, *::WARN', '-*', [
    { level: 'INFO', color: 'green', inverse: true },
    { level: 'FINE', color: 'white', inverse: true },
    { level: 'SEVERE', color: 'black', inverse: true },
    { level: 'ERR', color: 'red', inverse: true },
    { level: 'WARN', color: 'yellow', inverse: true }
]);
let filelogger;
filelogger = debugsx.createFileHandler(path.join(__dirname, '..') +
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
    '.log', '*::INFO, *::FINE, *::SEVERE, *::ERR, *::WARN', '-*', [
    { level: 'INFO', color: 'green', inverse: true },
    { level: 'FINE', color: 'white', inverse: true },
    { level: 'SEVERE', color: 'black', inverse: true },
    { level: 'ERR', color: 'red', inverse: true },
    { level: 'WARN', color: 'yellow', inverse: true }
]);
debugsx.addHandler(filelogger, consolelogger);
class Server {
    constructor() {
        this._express = express();
        this._musicInfo = {};
        this._express.use(bodyparser.json({ limit: '1mb' }));
        this._express.use(bodyparser.urlencoded({ limit: '1mb', extended: true }));
        this._express.use(requestLanguage({ languages: ['en-GB', 'en-US', 'de-DE', 'de-AT'] }));
        this._express.set('views', path.join(__dirname, '/views'));
        const pugEngine = this._express.set('view engine', 'pug');
        pugEngine.locals.pretty = true;
        this._express.use((req, res, next) => this.logger(req, res, next, 'Main'));
        this._express.use(function (req, res, next) {
            res.set('X-Clacks-Overhead', 'GNU Terry Pratchett');
            next();
        });
        this._express.use('/de', express.static(path.join(__dirname, './public/')));
        this._express.get('*.php', (req, res, next) => {
            res.sendFile(path.join(__dirname, '/views/no.html'));
        });
        this._express.use(express.static(path.join(__dirname, './public')));
        this._express.use(this.error404Handler);
        this._express.use(this.errorHandler);
    }
    static get Instance() {
        if (Server._instance === undefined) {
            Server._instance = new Server();
        }
        return Server._instance;
    }
    getMusicInfo(req, res, next) {
    }
    error404Handler(req, res, next) {
        const clientSocket = req.socket.remoteAddress + ':' + req.socket.remotePort;
        exports.log.warn('Error 404 for %s %s from %s', req.method, req.url, clientSocket);
        res.status(404).sendFile(path.join(__dirname, './views/error404.html'));
    }
    errorHandler(err, req, res, next) {
        const ts = new Date().toLocaleString();
        if (err.toString().startsWith('Error: ENOENT')) {
            res.sendFile(path.join(__dirname, './views/update.html'));
            exports.log.warn('Update deploying...');
        }
        else {
            exports.log.severe('Error %s\n%e', ts, err);
            res.status(500).render('error500.pug', {
                time: ts,
                err: err,
                href: 'mailto:sorogon.developer@gmail.com?subject=Server failed;&body=https://www.sorogon.eu/ failed at ' + ts + ' with Error: ' + err,
                serveradmin: 'Florian Greistorfer'
            });
            process.abort();
        }
    }
    logger(req, res, next, server) {
        const clientSocket = req.socket.remoteAddress + ':' + req.socket.remotePort;
        exports.log.info(server + ':', req.method, req.url, clientSocket);
        next();
    }
    start(port) {
        const musicChild = child.spawn('python ' + path.join(__dirname, '../media_control.py'));
        musicChild.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            this._musicInfo = data;
        });
        musicChild.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        musicChild.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
        return new Promise((resolve, reject) => {
            exports.log.info('Starting Server...');
            const server = http.createServer(this._express).listen(port, () => {
                exports.log.info('Server running on port ' + port + '.');
                server.on('close', () => {
                    exports.log.fine('Server stopped.');
                });
                server.on('err', err => {
                    exports.log.warn(err);
                });
            });
        });
    }
}
exports.Server = Server;

//# sourceMappingURL=server.js.map
