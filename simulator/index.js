#! /usr/bin/env node

var program = require('commander');
var commander = require('./command.js');

program
  .version('0.0.1');
// .description('Google Cloud Functions Simulator')

program
  .command('start')
  .description('Starts the simulator')
  .action(commander.start)
  .option('--project-id <id>',
    'Your Google Cloud Platform project ID. If not provided, the process.env.GCLOUD_PROJECT environment variable will not be set'
  )
  .option('--debug',
    'If true, start the simulator in debug mode'
  );;

program
  .command('stop')
  .description('Stops the simulator')
  .action(commander.stop);

program
  .command('kill')
  .description('Force kills the simulator process if it stops responding')
  .action(commander.kill);

program
  .command('restart')
  .description('Restarts the simulator')
  .action(commander.restart);

program
  .command('clear')
  .description(
    'Resets the simulator to its default state and clears any deploy functions'
  )
  .action(commander.clear);

program
  .command('status')
  .description('Returns the status of the simulator')
  .action(commander.status);

program
  .command('deploy <module> <function>')
  .description(
    'Deploys a function with the given module path and entry point'
  )
  .action(commander.deploy)
  .option('--trigger-http', 'Deploys this function as an HTTP function');

program
  .command('undeploy <function>')
  .description('Removes a previously deployed function')
  .action(commander.undeploy);

program
  .command('list')
  .description('Lists deployed functions')
  .action(commander.list);

program
  .command('get-logs')
  .description('Displays the logs for the simulator')
  .action(commander.getLogs)
  .option('--limit <limit>',
    'Number of log entries to be fetched. Default is 20');

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

if (program.args.length < 1) {
  program.help()
}