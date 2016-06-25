var DEFAULT_PORT = '8080';

var functions = {};

var request = require('request');

var net = require('net');
var spawn = require('child_process').spawn;

module.exports = {
  start: function() {
    startEmulator(DEFAULT_PORT);
  },
  stop: function() {
    doIfRunning(function() {
      stopEmulator(DEFAULT_PORT);
    });
  },
  restart: function() {
    checkStatus(DEFAULT_PORT, function(err) {
      if (err) {
        startEmulator(DEFAULT_PORT);
      } else {
        stopEmulator(DEFAULT_PORT, function(err) {
          if (err) {
            console.error(err);
            return;
          }
          startEmulator(DEFAULT_PORT);
        });
      }
    });

  },
  status: function() {
    checkStatus(DEFAULT_PORT, function(err) {
      if (err) {
        console.log('Emulator is STOPPED');
        return;
      }
      console.log('Emulator is RUNNING');
    });
  },
  deploy: function(modulePath, entryPoint) {
    action('POST', 'http://localhost:' + DEFAULT_PORT + '/function?name=' +
      entryPoint +
      '&path=' + modulePath,
      function(err) {
        if (err) {
          console.error(err);
          return;
        }
        console.log('Function ' + entryPoint + ' deployed');
      });
  },
  undeploy: function(fnName) {
    delete functions[fnName];
  },
  list: function() {
    for (var fn in functions) {
      console.log(fn);
    }
  }
};

var action = function action(method, uri, callback) {
  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      callback(
        'Emulator is not running.  Use \'functions start\' to start the emulator'
      );
      return;
    }
    request({
        method: method,
        uri: uri
      },
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          callback()
        } else {
          callback(body);
        }
      });
  });
}

var doIfRunning = function doIfRunning(fn) {
  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      console.log('Emulator is not running');
      return;
    }
    fn();
  });
}

var startEmulator = function startEmulator(port, callback) {

  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      console.log('Starting Emulator on port ' + port + '...');

      var child = spawn('node', ['server.js', port], {
        detached: true,
        stdio: 'ignore'
      });

      child.unref();

      waitForStart(port, 5000, function(err) {
        if (err) {
          console.error(err);
          if (callback) {
            callback(err);
          }
          return;
        }

        console.log('Emulator started');
        if (callback) {
          callback();
        }
      });
    } else {
      console.log('Emulator already running');
    }
  });
}

var stopEmulator = function stopEmulator(port, callback) {
  request.del('http://localhost:' + port, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      waitForStop(port, 5000, function(err) {
        if (err) {
          console.error('Timeout waiting for server to stop');
          callback(err);
          return;
        }

        console.log('Emulator stopped');
        if (callback) {
          callback();
        }
      });
    } else {
      console.error(error);
      if (callback) {
        callback(error);
      }
    }
  });
}

var waitForStop = function waitForStart(port, timeout, callback, i) {
  if (!i) {
    i = timeout / 500;
  }

  checkStatus(port, function(err) {
    if (err) {
      callback();
      return;
    }

    i--;

    if (i <= 0) {
      callback('Timeout waiting for server start');
      return;
    }

    setTimeout(function() {
      waitForStart(port, timeout, callback, i);
    }, 500);
  });
}

var waitForStart = function waitForStart(port, timeout, callback, i) {
  if (!i) {
    i = timeout / 500;
  }

  checkStatus(port, function(err) {
    if (!err) {
      callback();
      return;
    }

    i--;

    if (i <= 0) {
      callback('Timeout waiting for server start');
      return;
    }

    setTimeout(function() {
      waitForStart(port, timeout, callback, i);
    }, 500);
  });
}

var checkStatus = function checkStatus(port, callback) {
  var client = net.connect(port, 'localhost', function() {
    client.end();
    callback();
  });
  client.on('error', function(ex) {
    callback(ex);
  });
}