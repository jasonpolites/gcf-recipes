var express = require('express');
var log = require('simple-node-logger').createSimpleLogger('server.log');
var port = process.argv[2];
console.log('Starting emulator on port ' + port + '...');
var app = express();
var server;

var functions = {};

app.get('/', function(req, res) {
  res.send('Cloud Functions Emulator');
});

app.delete('/', function(req, res) {
  server.close();
  log.info('Server stopped');
  res.status(200).end();
  process.exit();
});

// Use function because we won't have functions called that (reserved word)
app.post("/function", function(req, res) {
  // deploy
  var path = req.query.path;
  try {
    functions[req.query.name] = {
      module: require(path),
      path: path
    };
    log.info('Deployed function ' + req.query.name + ' at path ' + path);
    res.status(200).end();
  } catch (err) {
    log.error(err.stack);
    res.status(400).send(err.message);
  }

});

app.delete("/function", function(req, res) {
  // undeploy
  delete functions[req.query.name];
  log.info('Undeployed function ' + req.query.name);
  res.status(200).end();
});

app.get("/function", function(req, res) {
  // list
  res.send(functions);
});

app.all("/*", function(req, res) {
  var fn = req.path.substring(1, req.path.length);
  log.info('Executing ' + req.method + ' on function ' + fn);
  if (functions[fn]) {
    functions[fn].module.call(this, req, res);
  } else {
    res.status(404).send('No function with name ' + fn);
  }
});

function logErrors(err, req, res, next) {
  log.error(err.stack);
  next(err);
}

app.use(logErrors);

var server = app.listen(port, function() {
  log.info('Server started');
});