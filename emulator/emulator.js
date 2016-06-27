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

const util = require('util')
const express = require('express');
const bodyParser = require('body-parser');;
const responseTime = require('response-time')
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const config = require('./config');

var self = {

  _app: null,
  _server: null,
  _functions: null,
  _config: {
    port: null,
    functionsFile: null,
    projectId: null
  },

  _init: function() {

    // Add a global error handler to catch all unexpected exceptions in the process
    // Note that this will not include any unexpected system errors (syscall failures)
    process.on('uncaughtException', function(err) {
      console.error(err.stack);

      // HACK:  An uncaught exception may leave the process in an incomplete state
      // however exiting the process prematurely may result in the above log call
      // to not complete.  This we're just going to wait for an arbitrary amount
      // of time for the log entry to complete.
      // Possible future solution here: https://github.com/winstonjs/winston/issues/228
      setTimeout(function() {
        process.exit(1);
      }, 1000);
    });

    // Custom log method to allow us to emit debug logs from this process without 
    // interfering with user code logs
    console.debug = function() {
      if (config.debug === true) {
        console.log.apply(console.log, arguments);
      }
    }

    // The port on which to listen for requests will be send by the CLI, or 
    // will default to 8080 in the absence of an argument.
    self._config.port = parseInt(process.argv[2] || '8080');

    // Set the project ID to be used
    self._config.projectId = process.argv[3] || '';
    process.env['GCLOUD_PROJECT'] = self._config.projectId;
    process.env['GCP_PROJECT'] = self._config.projectId;

    if (self._config.projectId) {
      console.debug('Set project ID to ' + self._config.projectId);
    }

    // The functions file is a registry of deployed functions.  We want 
    // function deployments to survive emulator restarts.
    self._config.functionsFile = path.resolve(__dirname, 'functions.json');

    // Ensure the function registry file exists
    try {
      fs.statSync(self._config.functionsFile);
    } catch (e) {
      if (e.code === 'ENOENT') {
        jsonfile.writeFileSync(self._config.functionsFile, {});
      } else {
        throw e;
      }
    }

    // Create or read the current registry file
    self._functions = jsonfile.readFileSync(self._config.functionsFile);

    // Create Express App
    self._setupApp();
  },

  _setupApp: function() {

    // Standard ExpressJS app.  Where possible this should mimic the *actual* 
    // setup of Cloud Functions regarding the use of body parsers etc.
    self._app = express();
    self._app.use(self._errorHandler);
    self._app.use(bodyParser.json());
    self._app.use(bodyParser.raw());
    self._app.use(bodyParser.text());
    self._app.use(bodyParser.urlencoded({
      extended: true
    }));

    // responseTime will allow us to track the execution time of a function
    self._app.use(responseTime());

    // Not really anything we need to do here, but responding to a browser GET
    // seems reasonable in case the developer wonders what's hogging their port
    // All internal emulator capabilities will be registered under the /function
    // path.  This should be safe because it would not be possible to deploy a 
    // function with that name if we assume that all function names in the 
    // emulator are *actual* function names from the module
    self._app.get('/', function(req, res) {
      if (req.query.project) {
        res.send(self._config.projectId);
      } else {
        res.send('Cloud Functions Emulator RUNNING');
      }
    });

    // Use a DELETE to signal the shutdown of the emulator.  The process will 
    // ultimately be "spawned" from the CLI so the channel to the parent process
    // will be lost
    self._app.delete('/', function(req, res) {
      console.debug('Server stopped');
      res.status(200).end();
      self._server.close();
    });

    /**
     * Deploys a function to the emulator
     * `functions deploy [options] <module> <function>`
     *
     * @example
     * functions deploy --type H ../myfunctions helloWorld
     *
     * @param {String} type (Optional)  The type of the function.  One of HTTP (H) or BACKGROUND (B).  Default is BACKGROUND
     * @param {String} module  A path on the local file system containing the Node module to deploy
     * @param {String} function  The function (entry point) to be invoked
     */
    self._app.post("/function/:name", function(req, res) {

      var p = path.resolve(req.query.path);
      var name = req.params.name;

      console.debug('Loading module in path ' + p)
      var mod = require(p);

      if (!mod[name]) {
        res.status(404).send('No function found in module ' + req.query
          .path +
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
        url = 'http://localhost:' + self._config.port + '/' + name
      }

      try {
        self._functions[name] = {
          name: name,
          path: p,
          type: type,
          url: url
        };

        jsonfile.writeFileSync(self._config.functionsFile, self._functions);

        console.debug('Deployed function ' + name + ' at path ' + p);

        res.json(self._functions[name]);
      } catch (err) {
        console.debug(err.stack);
        res.status(400).send(err.message);
      }
    });


    /**
     * Shuts down the emulator
     *
     * @example
     * functions stop
     */
    self._app.delete("/function", function(req, res) {
      self._functions = {};
      jsonfile.writeFileSync(self._config.functionsFile, self._functions);
      console.debug('Cleared all deployed functions');
      res.status(200).end();
    });

    /**
     * Undeploys a function to the emulator
     * `functions undeploy <function>`
     *
     * @example
     * functions undeploy helloWorld
     *
     * @param {String} function  The function to be removed
     */
    self._app.delete("/function/:name", function(req, res) {
      // undeploy
      delete self._functions[req.params.name];
      jsonfile.writeFileSync(self._config.functionsFile, self._functions);
      console.debug('Undeployed function ' + req.params.name);
      res.status(200).end();
    });

    /**
     * Lists all deployed functions
     *
     * @example
     * functions list
     */
    self._app.get("/function", function(req, res) {
      res.json(self._functions);
    });

    /**
     * Gets the details of a single function
     * `functions describe <function>`
     *
     * @example
     * functions describe helloWorld
     *
     * @param {String} function  The function to be described
     */
    self._app.get("/function/:name", function(req, res) {
      var name = req.params.name;
      if (self._functions[name]) {
        res.json(self._functions[name]);
        return;
      }
      res.sendStatus(404);
    });


    /**
     * Main entry point for all function invocations.  The path will be the 
     * function name.  In the case of HTTP functions the request/response from 
     * the original request will be passed through.  In the case of BACKGROUND 
     * functions the POST body will be extracted from this request and sent to 
     * the target function as the `data` argument
     *
     * @example
     * functions call helloWorld --data '{"message": "Hello World!"}'
     *
     * @param {String} data (Optional)  The data to be sent to the function, as a JSON object
     * @param {String} function  The function to be described
     */
    self._app.all("/*", function(req, res) {

      var fn = req.path.substring(1, req.path.length);

      console.debug('Executing ' + req.method + ' on function ' + fn);

      var record = self._functions[fn];

      if (record) {

        // Ensure the module is not loaded from cache
        // This has obvious negative performance implications, with the 
        // benefit of allowing function code to be changed out of band
        // without needing re-deployment
        delete require.cache[require.resolve(record.path)];

        // Require the target module to load the function for invocation
        var mod = require(record.path);

        var func = mod[fn];
        var type = record.type;

        var cwd = process.cwd();

        try {

          // Set the working directory to the target module path
          // TODO:  This is sub-optimal, but the alternative is to 
          // fork a new process with a separate HTTP server and pipe the req/res
          // from the master process.  In the context of an 'emulator", this is 
          // probably a reasonable trade-off.  It has the side effect of having 
          // unexpected behavior in concurrent function invocation scenarios      
          process.chdir(record.path);

          // Set the environment variables for this execution
          // As per the comment above, this is sub-optimal but probably an 
          // acceptable trade-off for an emulator
          process.env['FUNCTION_NAME'] = fn;

          if (type === 'HTTP') {

            // Record the time to report the execution time
            var timeInMs = Date.now();

            // Pass through HTTP
            func.call(this, req, res);

            // Change the working directory back to the original
            process.chdir(cwd);
          } else {
            // BACKGROUND
            var context = {
              success: function(val) {
                process.chdir(cwd);
                res.status(200).json(val);
              },
              failure: function(val) {
                process.chdir(cwd);
                res.status(500).json(val);
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
        } catch (err) {
          res.status(500).send(err.stack);
        }
      } else {
        res.status(404).send('No function with name ' + fn);
      }
    });
  },

  _errorHandler: function(err, req, res, next) {
    console.error(err.stack);
    next(err);
  },

  main: function() {
    self._init();
    console.debug('Starting emulator on port ' + self._config.port + '...');
    self._server = self._app.listen(self._config.port, function() {
      console.debug('Server started');
    });
  },
}

module.exports = self;

self.main();