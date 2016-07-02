// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var TIMEOUT_POLL_INCREMENT = 500;
var request = require('request');
var path = require('path');
var colors = require('colors');
var net = require('net');
var spawn = require('child_process').spawn;
var Table = require('cli-table2');
var config = require('./config.js');
var logreader = require('./logreader.js');

var LOG_FILE_PATH = path.join(path.join(__dirname, config.logFilePath), config.logFileName);
var APP_NAME = 'Cloud Functions Simulator ';

var self = {

  writer: {
    log: function() {
      console.log.apply(console, arguments);
    },
    error: function() {
      console.error.apply(console, arguments);
    },
    write: function() {
      console._stdout.write.apply(console._stdout, arguments);
    }
  },

  start: function(options, callback) {
    var projectId;
    if (options && options.projectId) {
      projectId = options.projectId;
    } else {
      projectId = config.projectId;
    }

    startSimulator(config.port, options.debug, projectId,
      function(err) {
        if (!err) {
          self.list(options, callback);
        } else {
          if (callback) {
            callback(err);
          }
        }
      });
  },

  stop: function(options, callback) {
    doIfRunning(function() {
      stopSimulator(config.port, callback);
    }, callback);
  },

  restart: function(options, callback) {
    doIfRunning(function() {
      getCurrentProjectId(function(err, projectId) {
        if (err) {
          self.writer.error(err);
          return;
        }
        stopSimulator(config.port, function(err) {
          if (err) {
            self.writer.error(err);
            return;
          }
          self.start({
            projectId: projectId
          }, callback);
        });
      });
    }, callback);
  },

  clear: function(options, callback) {
    // Remove the deployed functions
    action('DELETE', 'http://localhost:' + config.port + '/function/',
      function(err) {
        if (err) {
          self.writer.error(err);
          self.writer.error('Clear command aborted'.red);

          if (callback) {
            callback(err);
          }
          return;
        }

        self.writer.write(APP_NAME);
        self.writer.write('CLEARED\n'.green);
        self.list(options, callback);
      });
  },

  status: function(options, callback) {
    checkStatus(config.port, function(err) {
      self.writer.write(APP_NAME + "is ");
      if (err) {
        self.writer.write("STOPPED\n".red);
        if (callback) {
          callback(err);
        }
        return;
      }

      self.writer.write("RUNNING".green);
      self.writer.write(" on port " + config.port + "\n");

      if (callback) {
        callback();
      }
    });
  },

  getLogs: function(options) {

    var limit = 20;
    if (options.limit) {
      limit = parseInt(options.limit);
    }

    logreader.readLogLines(LOG_FILE_PATH, limit, function(val) {
      self.writer.write(val);
    });

  },

  deploy: function(modulePath, entryPoint, options, callback) {

    var type = (options.triggerHttp === true) ? 'H' : 'B';

    action('POST', 'http://localhost:' + config.port + '/function/' +
      entryPoint +
      '?path=' + modulePath +
      '&type=' + type,
      function(err, body) {
        if (err) {
          self.writer.error(err);
          self.writer.error('Deployment aborted'.red);

          if (callback) {
            callback(err);
          }
          return;
        }
        self.writer.log('Function ' + entryPoint + ' deployed'.green);
        printDescribe(body);
        if (callback) {
          callback(null, body);
        }
      });
  },
  undeploy: function(fnName, options, callback) {
    action('DELETE', 'http://localhost:' + config.port + '/function/' +
      fnName,
      function(err) {
        if (err) {
          self.writer.error(err);
          self.writer.error('Undeploy aborted'.red);

          if (callback) {
            callback(err);
          }
          return;
        }
        self.writer.log('Function ' + fnName + ' removed'.green);
        self.list(options, callback);
      });
  },
  list: function(options, callback) {
    action('GET', 'http://localhost:' + config.port + '/function',
      function(err, body) {
        if (err) {
          self.writer.error(err);
          if (callback) {
            callback(err);
          }
          return;
        }

        body = JSON.parse(body);

        var table = new Table({
          head: ['Name'.cyan, 'Type'.cyan, 'Path'.cyan],
          colWidths: [15, 12, 52]
        });

        var type, path;
        var count = 0;

        for (var func in body) {

          type = body[func].type;
          path = body[func].path;

          table.push([
            func.white,
            type.white,
            path.white
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

        var output = table.toString();

        self.writer.log(output);

        if (callback) {
          callback(null, body);
        }
      });
  },
  describe: function(name, options, callback) {
    action('GET', 'http://localhost:' + config.port + '/function/' + name,
      function(err, body) {
        if (err) {
          self.writer.error(err);

          if (callback) {
            callback(err);
          }

          return;
        }
        printDescribe(body);
        if (callback) {
          callback(null, body);
        }
      });
  },
  call: function(name, options, callback) {
    action('POST', 'http://localhost:' + config.port + '/' + name,
      function(err, body, response) {
        if (err) {
          self.writer.error(err);
          if (callback) {
            callback(err);
          }
          return;
        }

        self.writer.write("Function completed in:  ");
        self.writer.write((response.headers['x-response-time'] + '\n')
          .green);

        self.writer.log(body);

        if (callback) {
          callback(null, body);
        }

        checkStatus(config.port, function(err) {
          if (err) {
            self.writer.error(
              APP_NAME +
              'exited unexpectedly.  Check the simulator.log for more details'
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
    colWidths: [10, 70]
  });

  table.push(['Name', body.name.white]);
  table.push(['Type', body.type.white]);
  table.push(['Path', body.path.white]);

  if (body.url) {
    table.push(['Url', body.url.white]);
  }
  self.writer.log(table.toString());
}

var getCurrentProjectId = function getCurrentProjectId(callback) {
  action('GET', 'http://localhost:' + config.port + '/?project=true',
    function(err, body) {
      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      }
      if (callback) {
        callback(null, body);
      }
    });
}

var action = function action(method, uri, callback, data) {
  checkStatus(config.port, function(err) {
    if (err) {
      callback(
        APP_NAME +
        'is not running.  Use \'functions start\' to start the simulator'
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

    try {
      request(options,
        function(error, response, body) {
          if (!error && response.statusCode === 200) {
            callback(null, body, response)
          } else if (error) {
            callback(error, null, response);
          } else {
            callback(body, null, response);
          }
        });
    } catch (e) {
      console.error(e);
      callback(new Error(e));
    }
  });
}

var doIfRunning = function doIfRunning(running, notRunning) {
  checkStatus(config.port, function(err) {
    if (err) {
      self.writer.log(
        APP_NAME +
        'is not running ¯\\_(ツ)_/¯'.cyan);
      if (notRunning) {
        notRunning();
      }
      return;
    }
    running();
  });
}

var startSimulator = function startSimulator(port, debug, projectId, callback) {

  checkStatus(config.port, function(err) {
    if (err) {
      self.writer.log('Starting ' + APP_NAME + 'on port ' + port + '...');

      var args = [__dirname + '/simulator.js', port, projectId];

      if (debug === true) {
        args.unshift('--debug');
      }

      var child = spawn('node', args, {
        detached: true,
        stdio: 'inherit'
      });

      child.unref();

      waitForStart(port, config.timeout, function(err) {
        if (err) {
          self.writer.error(err);
          if (callback) {
            callback(err);
          }
          return;
        }
        self.writer.write(APP_NAME);
        self.writer.write('STARTED\n'.green);
        if (callback) {
          callback();
        }
      });
    } else {
      self.writer.log(APP_NAME + 'already running'.cyan);
    }
  });
}

var stopSimulator = function stopSimulator(port, callback) {
  request.del('http://localhost:' + port, function(error, response, body) {
    if (!error && response.statusCode == 200) {

      waitForStop(port, config.timeout, function(err) {
        if (err) {
          self.writer.error(err);
          callback(err);
          return;
        }

        self.writer.write(APP_NAME);
        self.writer.write('STOPPED\n'.red);
        if (callback) {
          callback();
        }
      });
    } else {
      self.writer.error(error);
      if (callback) {
        callback(error);
      }
    }
  });
}

var waitForStop = function waitForStart(port, timeout, callback, i) {
  if (!i) {
    i = timeout / TIMEOUT_POLL_INCREMENT;
  }

  checkStatus(port, function(err) {
    if (err) {
      callback();
      return;
    }

    i--;

    if (i <= 0) {
      callback('Error: Timeout waiting for simulator stop'.red);
      return;
    }

    setTimeout(function() {
      waitForStart(port, timeout, callback, i);
    }, TIMEOUT_POLL_INCREMENT);
  });
}

var waitForStart = function waitForStart(port, timeout, callback, i) {
  if (!i) {
    i = timeout / TIMEOUT_POLL_INCREMENT;
  }

  checkStatus(port, function(err) {
    if (!err) {
      callback();
      return;
    }

    i--;

    if (i <= 0) {
      callback('Error: Timeout waiting for simulator start'.red);
      return;
    }

    setTimeout(function() {
      waitForStart(port, timeout, callback, i);
    }, TIMEOUT_POLL_INCREMENT);
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