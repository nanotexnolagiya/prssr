#!/usr/bin/env node

require = require('esm')(module /*, options*/);
const { Command } = require("commander");
const chalk = require('chalk')
const { server } = require("../lib/server");
const packageJson = require("../package.json");
let PORT = null
const program = new Command(packageJson.name)
  .version(packageJson.version)
  .command("start")
  .option('-p, --port <number>', 'port number', 3000)
  .action(function() {
    console.error('Run script on port %s', this.opts().port);
  })
  .action((options) => {
    PORT = options.port
  })
  .option("--verbose", "print additional logs")
  .allowUnknownOption()
  .on("--help", () => {
    console.log(`    Only ${chalk.green("start")} is required.`);
    console.log();
  })
  .parse(process.argv);

if (PORT) {
  server.listen(PORT, (...args) => {
    console.log(`Server run by port ${chalk.green(PORT)}`);
  })
}
