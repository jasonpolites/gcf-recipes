#! /usr/bin/env node


var program = require('commander');
var emulator = require('./emulator.js');

var boo = function() {
  console.log('boo!')
};

program
  .version('0.0.1')

program
  .command('start')
  .description('Starts the emulator')
  .action(emulator.start);
// .option('--port', 'The port on which to run the emulator (default is 8080)');

program
  .command('stop')
  .description('Stops the emulator')
  .action(emulator.stop);

program
  .command('restart')
  .description('Restarts the emulator')
  .action(emulator.restart);

program
  .command('status')
  .description('Returns the status of the emulator server')
  .action(emulator.status);

program
  .command('deploy <module> <function>')
  .description(
    'Deploys a function with the given module path and entry point'
  )
  .action(emulator.deploy);

program
  .command('undeploy <function>')
  .description('Removes a previously deployed function')
  .action(emulator.undeploy);

program
  .command('list')
  .description('Lists deployed functions')
  .action(emulator.undeploy);

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}