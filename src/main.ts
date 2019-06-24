import { Server } from './server';
import { log } from './server';

const port = 6464;

class Main {
  constructor() {}

  public async init() {
    Server.Instance.start(port).catch(err => {
      log.severe(err);
      process.exit();
    });
  }
}

async function main() {
  const m = new Main();
  await m.init();
}

main();