"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const server_2 = require("./server");
const port = 6464;
class Main {
    constructor() { }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            server_1.Server.Instance.start(port).catch(err => {
                server_2.log.severe(err);
                process.exit();
            });
        });
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const m = new Main();
        yield m.init();
    });
}
main();

//# sourceMappingURL=main.js.map
