var DEFAULT_PORT = '8080';
var DEFAULT_TIMEOUT = 3000;

var functions = {};

var request = require('request');
var colors = require('colors');
var net = require('net');
var spawn = require('child_process').spawn;
var Table = require('cli-table2');

var self = {
  start: function() {
    startEmulator(DEFAULT_PORT, function(err) {
      if (!err) {
        self.list();
      }
    });
  },
  stop: function() {
    doIfRunning(function() {
      stopEmulator(DEFAULT_PORT);
    });
  },
  restart: function() {
    checkStatus(DEFAULT_PORT, function(err) {
      if (err) {
        self.start()
      } else {
        stopEmulator(DEFAULT_PORT, function(err) {
          if (err) {
            console.error(err);
            return;
          }
          self.start();
        });
      }
    });
  },
  clear: function() {
    // Remove the deployed functions
    action('DELETE', 'http://localhost:' + DEFAULT_PORT + '/function/',
      function(err) {
        if (err) {
          console.error(err);
          console.error('Clear command aborted'.red);
          return;
        }

        process.stdout.write("Cloud Functions Emulator ");
        process.stdout.write('CLEARED\n'.green);
        self.list();
      });
  },
  status: function() {
    checkStatus(DEFAULT_PORT, function(err) {
      process.stdout.write("Cloud Functions is ");
      if (err) {
        process.stdout.write("STOPPED\n".red);
        return;
      }
      process.stdout.write("RUNNING\n".green);
    });
  },
  deploy: function(modulePath, entryPoint, options) {
    // console.log(options.type);
    action('POST', 'http://localhost:' + DEFAULT_PORT + '/function/' + entryPoint +
      '?path=' + modulePath +
      '&type=' + options.type,
      function(err, body) {
        if (err) {
          console.error(err);
          console.error('Deployment aborted'.red);
          return;
        }
        console.log('Function ' + entryPoint + ' deployed'.green);
        printDescribe(body);
      });
  },
  undeploy: function(fnName) {
    action('DELETE', 'http://localhost:' + DEFAULT_PORT + '/function/' +
      fnName,
      function(err) {
        if (err) {
          console.error(err);
          console.error('Undeploy aborted'.red);
          return;
        }
        console.log('Function ' + fnName + ' removed'.green);
        self.list();
      });
  },
  list: function() {
    action('GET', 'http://localhost:' + DEFAULT_PORT + '/function',
      function(err, body) {
        if (err) {
          console.error(err);
          return;
        }

        body = JSON.parse(body);

        var table = new Table({
          head: ['Name'.cyan, 'Type'.cyan, 'Path'.cyan],
          colWidths: [20, 12, 60]
        });

        var type, path;
        var count = 0;

        for (var func in body) {

          type = body[func].type;
          path = body[func].path;

          table.push([
            func,
            type,
            path
          ]);

          count++;
        }

        if (count === 0) {
          table.push([{
            colSpan: 3,
            content: 'No functions deployed ¯\\_(ツ)_/¯.  Run \'functions deploy\' to deploy a function'
              .gray
          }]);
        }
        console.log(table.toString());
      });
  },
  describe: function(name) {
    action('GET', 'http://localhost:' + DEFAULT_PORT + '/function/' + name,
      function(err, body) {
        if (err) {
          console.error(err);
          return;
        }
        printDescribe(body);
      });
  },
  call: function(name, options) {
    action('POST', 'http://localhost:' + DEFAULT_PORT + '/' + name,
      function(err, body, response) {

        process.stdout.write("Function completed in:  ");
        process.stdout.write((response.headers['x-response-time'] + '\n').green);

        if (err) {
          console.error(err);
          return;
        }

        console.log(body);

        checkStatus(DEFAULT_PORT, function(err) {
          if (err) {
            console.error(
              'Cloud Functions Emulator exited unexpectedly.  Check the emulator.log for more details'
              .red);
            return;
          }
        });

      }, options.data);
  }
};

module.exports = self;

var printDescribe = function printDescribe(body) {
  body = JSON.parse(body);

  var table = new Table({
    head: ['Property'.cyan, 'Value'.cyan],
    colWidths: [10, 60]
  });

  table.push(['Name', body.name]);
  table.push(['Type', body.type]);
  table.push(['Path', body.path]);

  if (body.url) {
    table.push(['Url', body.url.green]);
  }
  console.log(table.toString());
}

var action = function action(method, uri, callback, data) {
  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      callback(
        'Cloud Functions Emulator is not running.  Use \'functions start\' to start the emulator'
        .cyan
      );
      return;
    }

    var options = {
      method: method,
      url: uri
    };

    if (method === 'POST' && data) {
      options.json = JSON.parse(data);
    }

    request(options,
      function(error, response, body) {
        if (!error && response.statusCode === 200) {
          callback(null, body, response)
        } else {
          callback(body, null, response);
        }
      });
  });
}

var doIfRunning = function doIfRunning(fn) {
  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      console.log('Cloud Functions Emulator is not running ¯\\_(ツ)_/¯'.cyan);
      return;
    }
    fn();
  });
}

var startEmulator = function startEmulator(port, callback) {

  checkStatus(DEFAULT_PORT, function(err) {
    if (err) {
      console.log('Starting Cloud Functions Emulator on port ' + port + '...');

      var child = spawn('node', [__dirname + '/emulator.js', port], {
        detached: true,
        stdio: 'inherit'
      });

      child.unref();

      waitForStart(port, DEFAULT_TIMEOUT, function(err) {
        if (err) {
          console.error(err);
          if (callback) {
            callback(err);
          }
          return;
        }
        process.stdout.write("Cloud Functions Emulator ");
        process.stdout.write('STARTED\n'.green);
        if (callback) {
          callback();
        }
      });
    } else {
      console.log('Cloud Functions Emulator already running'.cyan);
    }
  });
}

var stopEmulator = function stopEmulator(port, callback) {
  request.del('http://localhost:' + port, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      waitForStop(port, DEFAULT_TIMEOUT, function(err) {
        if (err) {
          console.error(err);
          callback(err);
          return;
        }

        process.stdout.write("Cloud Functions Emulator ");
        process.stdout.write('STOPPED\n'.red);
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
      callback('Error: Timeout waiting for emulator stop'.red);
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
      callback('Error: Timeout waiting for emulator start'.red);
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