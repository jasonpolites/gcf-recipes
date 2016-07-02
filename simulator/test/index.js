var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var execSync = require('child_process').exec;

var commander = require('../command.js');

// Empty writer
commander.writer = {
  log: function() {},
  error: function() {},
  write: function() {}
};

describe('Cloud Functions Emulator Tests', function() {

  var TEST_MODULE = __dirname + '/test_module';

  beforeEach(function(done) {
    commander.status({}, function(err) {
      if (err) {
        commander.start({}, done);
      } else {
        done();
      }
    });
  });

  afterEach(function(done) {
    commander.status({}, function(err) {
      if (!err) {
        commander.clear({}, done);
      } else {
        done();
      }
    });
  });

  after(function(done) {
    commander.status({}, function(err) {
      if (!err) {
        commander.stop({}, done);
      } else {
        done();
      }
    });
  });

  it('Test status reports correct state after emulator start/stop', function(done) {
    // Expect to start running
    commander.status({}, function(err) {
      if (err) {
        done(new Error(err));
        return;
      }
      // Stop the emulator
      commander.stop({}, function(err) {
        if (err) {
          done(new Error(err));
          return;
        }

        // We now expect it to report stopped
        commander.status({}, function(err) {
          if (err) {
            done();
          } else {
            done(new Error(
              'Status did not report STOPPED after stop was called'
            ));
          }
        });
      });
    });
  });

  it('Test status reports correct state after emulator restart', function(done) {
    // Expect to start running
    commander.status({}, function(err) {
      if (err) {
        done(new Error(err));
        return;
      }
      // Restart the emulator
      commander.restart({}, function(err) {
        if (err) {
          done(new Error(err));
          return;
        }

        // We now expect it to report started
        commander.status({}, function(err) {
          if (err) {
            done(new Error(
              'Status did not report RUNNING after restart was called'
            ));
          } else {
            done();
          }
        });
      });
    });
  });

  it('Deploys without error when the module and function exist', function(done) {
    commander.deploy(TEST_MODULE, 'hello', {}, done);
  });

  it('Fails deployment when the module doesn\'t exist', function(done) {
    commander.deploy('foobar', 'hello', {}, function(err) {
      if (err) {
        done();
        return;
      }
      done(new Error('Deployment should have failed but didn\'t'));
    });
  });

  it('Fails deployment when the function doesn\'t exist', function(done) {
    commander.deploy(TEST_MODULE, 'foobar', {}, function(err) {
      if (err) {
        done();
        return;
      }
      done(new Error('Deployment should have failed but didn\'t'));
    });
  });

  it('Returns the expected values in the list after deployment', function(done) {
    commander.deploy(TEST_MODULE, 'hello', {}, function(err) {
      if (err) {
        done(err);
        return;
      }

      commander.list({}, function(err, list) {
        if (err) {
          done(err);
          return;
        }

        try {
          chai.expect(list).to.deep.equal({
            "hello": {
              name: 'hello',
              path: TEST_MODULE,
              type: 'BACKGROUND',
              url: null
            }
          });

          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });

  it('Returns the expected values in the list after deployment AND clear', function(
    done) {
    commander.deploy(TEST_MODULE, 'hello', {}, function(err) {
      if (err) {
        done(err);
        return;
      }

      commander.clear({}, function(err) {
        if (err) {
          done(err);
          return;
        }
        commander.list({}, function(err, list) {
          try {
            chai.expect(list).to.deep.equal({});
            done();
          } catch (e) {
            done(e);
          }
        });
      });
    });
  });

  it('Calling a function works', function(
    done) {
    commander.deploy(TEST_MODULE, 'hello', {}, function(err) {
      if (err) {
        done(err);
        return;
      }
      commander.call('hello', {}, function(err, body) {
        if (err) {
          done(err);
          return;
        }
        try {
          chai.expect(JSON.parse(body)).to.equal('Hello World');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});