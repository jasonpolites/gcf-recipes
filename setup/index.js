var async = require('async');
var path = require('path');
var fs = require('fs');
var exec = require("child_process").exec;
var format = require("string-template");
var
  dryRun = false,
  projectId = null;

var COMMON_STEPS = {
  serial: [{
    "desc": "Set project",
    "type": "console",
    "cmd": "gcloud config set project {projectId}"
  }]
};

var self = {
  main: function(argv) {
    var args = require('minimist')(process.argv.slice(2));
    // Get the first arg
    var vals = args['_'];

    if (args['help'] || args['h']) {
      self.help();
      return;
    }

    if (vals.length < 1) {
      self.help();
      return;
    }

    var command = vals[0];

    projectId = vals[2];
    dryRun = (command === 'dryrun');

    if (command === 'install' || dryRun) {
      if (vals.length < 3) {
        self.help();
        return;
      }
      _install(vals[1]);
    } else if (command === 'list') {
      _list();
    }
  },
  help: function() {
    console.log(
      '\nUsage: node setup <command> [optional args]' +
      '\n\Commands:' +
      '\n  install\t<sample> <project-id>\tInstalls the given sample in the given project.' +
      '\n  dryrun\t<sample> <project-id>\tSame as install, but just prints the commands to be run.' +
      '\n  list\t\t\t\t\tLists available samples.' +
      '\n\nExample:' +
      '\n  node setup install datastore my-project' +
      '\n'
    )
  }
};

var _install = function(module) {
  var cmds;
  var cwd = path.join(__dirname, '../') + module;
  try {
    cmds = require(cwd + '/setup.json');
  } catch (e) {
    console.error(e.message);
    return;
  }
  if (!cmds) {
    console.error('no setup.json');
    return;
  }
  _run(cmds, cwd, function(err) {
    if (err) {
      console.error(err);
    }
  });
}

var _list = function() {
  var dirs = _getInstallables(path.join(__dirname, '../'));
  if (dirs.length > 0) {
    console.log('\nSAMPLES\n-------');
    dirs.forEach(function(val) {
      console.log(val);
    });
    console.log('\n');
  } else {
    console.log('\nNo installable samples\n');
  }
}

var _getInstallables = function(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    var dirPath = path.join(srcpath, file);
    if (fs.statSync(dirPath).isDirectory()) {
      var setupJSON = path.join(dirPath, 'setup.json');
      return fs.existsSync(setupJSON);
    };
  });
}

var _run = function(cmds, cwd, callback) {
  var steps = cmds.steps;
  steps.unshift(COMMON_STEPS);
  _runStep(cwd, steps, 0, callback);
}

var _runStep = function(cwd, steps, index, callback) {
  if (index < steps.length) {
    var step = steps[index];
    var serial = step.serial;
    var parallel = step.parallel;
    if (serial && serial.length > 0) {
      _runSerialCommands(cwd, serial, function(err) {
        if (err) {
          callback(err);
          return;
        }
        if (parallel && parallel.length > 0) {
          _runParallelCommands(cwd, parallel, function(err) {
            if (err) {
              callback(err);
              return;
            }
            _runStep(cwd, steps, ++index, callback);
          });
        } else {
          _runStep(cwd, steps, ++index, callback);
        }
      });
    } else {
      if (parallel && parallel.length > 0) {
        _runParallelCommands(cwd, parallel, function(err) {
          if (err) {
            callback(err);
            return;
          }
          _runStep(cwd, steps, ++index, callback);
        });
      } else {
        _runStep(cwd, steps, ++index, callback);
      }
    }
  }
}

var _runSerialCommands = function(cwd, cmds, callback) {
  async.eachSeries(cmds, function iteratee(cmd, innerCallback) {
    _runCommand(cwd, cmd, innerCallback);
  }, callback);
}

var _runParallelCommands = function(cwd, cmds, callback) {
  async.each(cmds, function iteratee(cmd, innerCallback) {
    _runCommand(cwd, cmd, innerCallback);
  }, callback);
}

var _runCommand = function(cwd, cmd, callback) {

  console.log(cmd.desc);

  var type = cmd.type;
  var command = format(cmd.cmd, {
    'projectId': projectId
  });

  if (dryRun === true) {
    console.log(type + ": " + command);
    callback();
    return;
  }

  if (type === 'macro') {
    var elems = command.split(/\s+/);
    var func = _macros[elems[0]];
    if (!func) {
      callback('No macro found with name ' + elems[0]);
      return;
    }

    // Remove the macro name
    elems.shift();

    // Add the callback to the back
    elems.push(callback);

    // Add the project ID to the front
    elems.unshift(projectId);

    func.apply(this, elems);
  } else if (type === 'console') {
    _exec(command, cwd, callback);
  }
}

var _exec = function(cmd, cwd, callback) {
  exec(cmd, {
    cwd: cwd
  }, function(error, stdout, stderr) {
    if (error) {
      callback(error);
      return;
    }
    // if (stdout) {
    //   process.stdout.write('\n');
    //   process.stdout.write(stdout);
    // }
    // if (stderr) {
    //   process.stderr.write('\n');
    //   process.stderr.write(stderr);
    // }
    callback();
  });
}
var _macros = {
  // Make bucket
  MB: function(projectId, bucketName, callback) {
    var gcloud = require('gcloud')({
      projectId: projectId
    });
    var storage = gcloud.storage();
    var bucket = storage.bucket(bucketName);
    bucket.exists(function(err, exists) {
      if (err) {
        callback(err);
        return;
      }
      if (exists !== true) {
        storage.createBucket(bucketName, callback);
      } else {
        callback(null, bucket);
      }
    });
  }
};


module.exports = self;

self.main(process.argv);