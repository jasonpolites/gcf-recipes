#! /usr/bin/env node

var program = require('commander');
var commander = require('./command.js');

var boo = function() {
  console.log('boo!')
};

program
  .version('0.0.1')

program
  .command('start')
  .description('Starts the emulator')
  .action(commander.start);

program
  .command('stop')
  .description('Stops the emulator')
  .action(commander.stop);

program
  .command('restart')
  .description('Restarts the emulator')
  .action(commander.restart);

program
  .command('clear')
  .description('Resets the emulator to its default state and clears any deploy functions')
  .action(commander.clear);

program
  .command('status')
  .description('Returns the status of the emulator')
  .action(commander.status);

program
  .command('deploy <module> <function>')
  .description(
    'Deploys a function with the given module path and entry point'
  )
  .action(commander.deploy)
  .option('--type <type>',
    'The type of the function.  One of HTTP (H) or BACKGROUND (B).  Default is BACKGROUND',
    /^(http|backround|h|b)$/i,
    'b'
  );

program
  .command('undeploy <function>')
  .description('Removes a previously deployed function')
  .action(commander.undeploy);

program
  .command('list')
  .description('Lists deployed functions')
  .action(commander.list);

program
  .command('describe <function>')
  .description('Describes the details of a single deployed function')
  .action(commander.describe);

program
  .command('call <function>')
  .description('Invokes a function')
  .action(commander.call)
  .option('--data <json>',
    'The data to send to the function, expressed as a JSON document');

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}