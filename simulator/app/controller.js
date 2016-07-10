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

const TIMEOUT_POLL_INCREMENT = 500;
const request = require('request');
const path = require('path');
const net = require('net');
const spawn = require('child_process').spawn;
const config = require('../config.js');
const logreader = require('./logreader.js');
const fs = require('fs');
const LOG_FILE_PATH = path.join(path.join(__dirname, config.logFilePath), config.logFileName);
const PID_PATH = path.join(__dirname, 'process.pid');

const SIMULATOR_ROOT_URI = 'http://localhost:' + config.port;
const SIMULATOR_FUNC_URI = SIMULATOR_ROOT_URI + '/function/';

var self = {

  STOPPED: 0,
  RUNNING: 1,
  ALREADY_RUNNING: 2,
  KILLED: 3,

  start: function(projectId, debug, callback) {

    if (!projectId) {
      projectId = config.projectId;
    }

    self._checkStatus(config.port, function(err) {
      if (err) {
        var args = [__dirname + '/simulator.js', config.port, projectId];

        if (debug === true || debug === 'true') {
          args.unshift('--debug');
        }

        var env = process.env;
        env.DEBUG = debug;

        var child = spawn('node', args, {
          detached: true,
          stdio: 'inherit',
          env: env
        });

        // Write the pid to the file system in case we need to kill it
        self._writePID(child.pid);

        child.unref();

        self._waitForStart(config.port, config.timeout, function(err) {
          if (err) {
            if (callback) {
              callback(err);
            }
            return;
          }
          if (callback) {
            // Started
            callback(null, self.RUNNING);
          }
        });
      } else {
        if (callback) {
          // Already running
          callback(null, self.ALREADY_RUNNING);
        }
      }
    });
  },

  stop: function(callback) {
    self._doIfRunning(function() {
      request.del(SIMULATOR_ROOT_URI,
        function(error, response,
          body) {
          if (!error && response.statusCode == 200) {
            self._waitForStop(config.port, config.timeout, function(err) {
              if (err) {
                callback(err);
                return;
              }

              self._deletePID();

              if (callback) {
                callback();
              }
            });
          } else {
            if (callback) {
              callback(error);
            }
          }
        });
    }, callback);
  },

  kill: function(callback) {
    try {
      var stats = fs.statSync(PID_PATH);
      if (stats.isFile()) {
        // Read the PID
        var pid = fs.readFileSync(PID_PATH);
        if (pid) {
          pid = parseInt(pid);
          try {
            process.kill(pid);
          } catch (e) {
            if (e.code !== 'ESRCH') {
              // No such process
              if (callback) {
                callback(e);
              }
              return;
            }
          }
          self._deletePID();
          if (callback) {
            callback(null, self.KILLED);
          }
          return;
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        if (callback) {
          callback(e);
        }
        return;
      }
    }

    if (callback) {
      callback(null, self.STOPPED);
    }
  },

  restart: function(callback) {
    self._doIfRunning(function() {
      self.getCurrentEnvironment(function(err, env) {
        if (err) {
          callback(err);
          return;
        }
        self.stop(function(err) {
          if (err) {
            callback(err);
            return;
          }

          self.start(
            env.projectId,
            env.debug,
            callback);
        });
      });
    }, function() {
      if (callback) {
        callback(null, self.STOPPED);
      }
    });
  },

  clear: function(callback) {
    // Remove the deployed functions
    self._action('DELETE', SIMULATOR_FUNC_URI,
      function(err) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        if (callback) {
          callback();
        }
      });
  },

  status: function(callback) {
    self._checkStatus(config.port, function(err) {
      if (err) {
        if (callback) {
          callback(null, self.STOPPED);
        }

        return;
      }
      if (callback) {
        callback(null, self.RUNNING);
      }
    });
  },

  getLogs: function(writer, limit) {
    if (!limit) {
      limit = 20;
    }
    logreader.readLogLines(LOG_FILE_PATH, limit, function(val) {
      writer.write(val);
    });

  },

  deploy: function(modulePath, entryPoint, type, callback) {
    self._action('POST', SIMULATOR_FUNC_URI +
      entryPoint +
      '?path=' + modulePath +
      '&type=' + type,
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
  },

  undeploy: function(name, callback) {
    self._action('DELETE', SIMULATOR_FUNC_URI +
      name,
      function(err) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        if (callback) {
          callback();
        }
      });
  },

  list: function(callback) {
    self._action('GET', SIMULATOR_FUNC_URI,
      function(err, body) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }
        if (callback) {
          callback(null, JSON.parse(body));
        }
      });
  },

  describe: function(name, callback) {
    self._action('GET', SIMULATOR_FUNC_URI + name,
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
  },

  call: function(name, data, callback) {
    self._action('POST', SIMULATOR_ROOT_URI + '/' + name,
      function(err, body, response) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }

        if (callback) {
          callback(null, body, response);
        }
      }, data);
  },

  getCurrentEnvironment: function(callback) {
    self._action('GET', SIMULATOR_ROOT_URI + '/?env=true',
      function(err, body) {
        if (err) {
          if (callback) {
            callback(err);
          }
          return;
        }
        if (callback) {
          callback(null, JSON.parse(body));
        }
      });
  },

  _waitForStop: function(port, timeout, callback, i) {
    if (!i) {
      i = timeout / TIMEOUT_POLL_INCREMENT;
    }

    self._checkStatus(port, function(err) {
      if (err) {
        callback();
        return;
      }

      i--;

      if (i <= 0) {
        callback('Error: Timeout waiting for simulator stop');
        return;
      }

      setTimeout(function() {
        self._waitForStop(port, timeout, callback, i);
      }, TIMEOUT_POLL_INCREMENT);
    });
  },

  _waitForStart: function(port, timeout, callback, i) {
    if (!i) {
      i = timeout / TIMEOUT_POLL_INCREMENT;
    }

    self._checkStatus(port, function(err) {
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
        self._waitForStart(port, timeout, callback, i);
      }, TIMEOUT_POLL_INCREMENT);
    });
  },

  _checkStatus: function(port, callback) {
    var client = net.connect(port, 'localhost', function() {
      client.end();
      callback();
    });
    client.on('error', function(ex) {
      callback(ex);
    });
  },

  _action: function(method, uri, callback, data) {
    self._checkStatus(config.port, function(err) {
      if (err) {
        if (callback) {
          callback(err);
        }
        return;
      };

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
  },

  _doIfRunning: function(running, notRunning) {
    self._checkStatus(config.port, function(err) {
      if (err) {
        if (notRunning) {
          notRunning();
        }
        return;
      }
      running();
    });
  },

  _writePID: function(pid) {
    // Write the pid to the file system in case we need to kill it
    fs.writeFile(PID_PATH, pid,
      function(err) {
        if (err) {
          // Don't throw, just abort
          console.log(err);
        }
      });
  },

  _deletePID: function() {
    fs.unlink(PID_PATH,
      function(err) {
        if (err) {
          // Don't throw, just abort
          console.log(err);
        }
      });
  }
};

module.exports = self;