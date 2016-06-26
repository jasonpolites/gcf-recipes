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

program
  .command('stop')
  .description('Stops the emulator')
  .action(emulator.stop);

program
  .command('restart')
  .description('Restarts the emulator')
  .action(emulator.restart);

program
  .command('clear')
  .description('Resets the emulator to its default state and clears any deploy functions')
  .action(emulator.clear);

program
  .command('status')
  .description('Returns the status of the emulator server')
  .action(emulator.status);

program
  .command('deploy <module> <function>')
  .description(
    'Deploys a function with the given module path and entry point'
  )
  .action(emulator.deploy)
  .option('--type <type>',
    'The type of the function.  One of HTTP (H) or BACKGROUND (B).  Default is BACKGROUND',
    /^(http|backround|h|b)$/i,
    'b'
  );

program
  .command('undeploy <function>')
  .description('Removes a previously deployed function')
  .action(emulator.undeploy);

program
  .command('list')
  .description('Lists deployed functions')
  .action(emulator.list);

program
  .command('describe <function>')
  .description('Describes the details of a single deployed function')
  .action(emulator.describe);

program
  .command('call <function>')
  .description('Invokes a function')
  .action(emulator.call)
  .option('--data <json>',
    'The data to send to the function, expressed as a JSON document');

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}