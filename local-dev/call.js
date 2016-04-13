var context = {
  "success" : function(val) {
    console.log(val);
  },

  "failure" : function(err) {
    console.error(err);
  }
};

var program = require('commander');
 
program
  .version('0.0.1')
  .description('Execute the node module given by the module argument')
  .usage('[options] <module> <function>')
  .option('--project-id [id]', 'Your Cloud Platform project id')
  .option('--keyFilename [path]', 'The path to your oAuth key file')
  .option('--data [json]', 'The payload to be sent to the function')
  .parse(process.argv);

if(program.args.length === 0) {
  program.outputHelp();
} else {
  var module;
  try {

    var entryPoint = program.entryPoint;
    var keyFilename = program.keyFilename;
    var projectId = program.projectId;
    var data = program.data;
    var fn;

    module = require(program.args[0]);
    entryPoint = program.args[1];

    if(entryPoint) {
      fn = module[entryPoint];

      if(keyFilename) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename;
      }

      if(projectId) {
        process.env.GCLOUD_PROJECT = projectId;
      }

      if(!data) {
        data = {};
      } else {
        data = JSON.parse(data);
      }

      fn.call(this, context, data);
    } else {
      console.error("No entry point (function) specified");
    }
  } catch (e) {
    console.error("Failed to load module: " + program.args[0] + ".  Are you sure the path is correct? (relative to " + __dirname + ")\n\t↳ Nested error was:\n\t\t↳ " + e.message + ":" + e.code);
  }
}