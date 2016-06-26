var util = require('util')
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
var log = require('simple-node-logger').createSimpleLogger('emulator.log');
var port = process.argv[2];
var app = express();
var jsonfile = require('jsonfile');
var fs = require('fs');

var server;
var DEPLOYED_FUNCTIONS_FILE = './functions.json';

function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
}

process.on('uncaughtException', function(err) {
  console.error((new Date).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack);
  setTimeout(function() {
    process.exit(1);
  }, 1000);
})

app.use(logErrors);
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Override console logger
function formatArgs(args) {
  return [util.format.apply(util.format, Array.prototype.slice.call(args))];
}
console.log = function() {
  log.info.apply(log, formatArgs(arguments));
};
console.error = function() {
  log.error.apply(log, formatArgs(arguments));
};
console.debug = function() {
  log.debug.apply(log, formatArgs(arguments));
};

console.debug('Starting emulator on port ' + port + '...');

try {
  fs.statSync(DEPLOYED_FUNCTIONS_FILE);
} catch (e) {
  if (e.code === 'ENOENT') {
    jsonfile.writeFileSync(DEPLOYED_FUNCTIONS_FILE, {});
  } else {
    throw e;
  }
}

var functions = jsonfile.readFileSync(DEPLOYED_FUNCTIONS_FILE);

app.get('/', function(req, res) {
  res.send('Cloud Functions Emulator');
});

app.delete('/', function(req, res) {
  server.close();
  console.debug('Server stopped');
  res.status(200).end();
  process.exit();
});

app.post("/function/:name", function(req, res) {
  // deploy
  var p = path.resolve(req.query.path);
  var name = req.params.name;

  console.debug('Loading module in path ' + p)
  var mod = require(p);

  if (!mod[name]) {
    res.status(404).send('No function found in module ' + req.query.path +
      ' with name ' + name);
    return;
  }

  var type = req.query.type.toUpperCase();
  var url = null;

  if (type === 'B') {
    type = 'BACKGROUND';
  } else if (type === 'H') {
    type = 'HTTP'
  }

  if (type === 'HTTP') {
    url = 'http://localhost:' + port + '/' + name
  }

  try {
    functions[name] = {
      name: name,
      // mod: mod,
      path: p,
      type: type,
      url: url
    };

    jsonfile.writeFileSync(DEPLOYED_FUNCTIONS_FILE, functions);

    console.debug('Deployed function ' + name + ' at path ' + p);
    res.json(functions[name]);
  } catch (err) {
    console.debug(err.stack);
    res.status(400).send(err.message);
  }
});

app.delete("/function", function(req, res) {
  // undeploy
  functions = {};
  jsonfile.writeFileSync(DEPLOYED_FUNCTIONS_FILE, {});
  console.debug('Cleared all deployed functions');
  res.status(200).end();
});

app.delete("/function/:name", function(req, res) {
  // undeploy
  delete functions[req.params.name];
  jsonfile.writeFileSync(DEPLOYED_FUNCTIONS_FILE, functions);
  console.debug('Undeployed function ' + req.params.name);
  res.status(200).end();
});

app.get("/function", function(req, res) {
  res.json(functions);
});

app.get("/function/:name", function(req, res) {
  var name = req.params.name;
  if (functions[name]) {
    res.json(functions[name]);
    return;
  }
  res.sendStatus(404);
});

app.all("/*", function(req, res) {

  var fn = req.path.substring(1, req.path.length);

  console.debug('Executing ' + req.method + ' on function ' + fn);

  var record = functions[fn];

  if (record) {

    delete require.cache[require.resolve(record.path)];
    var mod = require(record.path);

    var func = mod[fn];
    var type = record.type;

    if (type === 'HTTP') {
      // Pass through HTTP
      func.call(this, req, res);
    } else {
      // BACKGROUND
      var context = {
        success: function(val) {
          res.status(200).json(val);
          // global.gc();
        },
        failure: function(val) {
          res.status(500).json(val);
          // global.gc();
        },
        done: function(val) {
          if (val) {
            context.failure(val);
            return;
          }
          context.success();
        }
      };

      func.call(this, context, req.body);
    }
  } else {
    res.status(404).send('No function with name ' + fn);
  }
});


var server = app.listen(port, function() {
  console.debug('Server started');
});