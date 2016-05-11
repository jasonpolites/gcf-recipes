var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Cloud Pub/Sub Tests', function() {

  var mut = require('../index.js');
  var gcloud = require('gcloud');

  var context = {
    success: function(val) {},
    failure: function(val) {}
  };

  var mockContext;

  beforeEach(function() {
    mockContext = sinon.mock(context);
  });

  afterEach(function() {
    mockContext.restore();
    if (gcloud.pubsub.restore) {
      gcloud.pubsub.restore();
    }
  });

  it('Publish fails without a topic', function() {

    mockContext.expects('failure').once().withArgs(
      'Topic not provided. Make sure you have a \'topic\' property in your request'
    );

    var data = {
      'message': 'foobar_message'
    };

    mut.publish(context, data);

    mockContext.verify();
  });

  it('Publish fails without a message', function() {

    mockContext.expects('failure').once().withArgs(
      'Message not provided. Make sure you have a \'message\' property in your request'
    );

    var data = {
      'topic': 'foobar_topic'
    };

    mut.publish(context, data);

    mockContext.verify();

  });

  it('Publishes the message to the topic and calls success', function(done) {

    // Data can be anything, our mocks will load a mock file no matter what
    var data = {
      'topic': 'foobar_topic',
      'message': 'foobar_message'
    };

    // This is the argument we expect to see published
    var expectedArg = {
      data: {
        message: data['message'],
      },
    }

    // Stub out gcloud storage so we can return our dummy file stream
    var pubsub = {
      'topic': function() {}
    };
    var topic = {
      'publish': function() {}
    };

    sinon.stub(gcloud, 'pubsub').returns(pubsub);
    var pubsubStub = sinon.stub(pubsub, 'topic').returns(topic);
    var topicStub = sinon.stub(topic, 'publish').callsArg(1);

    // Create a mock context object that will also contain our assertions in the callback
    var context = {
      success: function(val) {
        try {

          // Assert that the properties of the data object were correctly used to
          // load the file
          sinon.assert.calledWith(pubsubStub, 'foobar_topic');
          sinon.assert.calledWith(topicStub, expectedArg);

          chai.expect(val).to.equal('Message published');

          done();

        } catch (e) {
          done(e);
        }
      },
      failure: function(err) {
        done(err);
      }
    };

    // We need the module to load our mocked versions
    // Use proxyquire to shim in the stubs
    var stubs = {
      'gcloud': gcloud
    };

    // Require the module under test and stub out gcloud
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.publish(context, data);
  });

  it('Fails to publish the message to the topic and calls failure',
    function(done) {

      // Data can be anything, our mocks will load a mock file no matter what
      var data = {
        'topic': 'foobar_topic',
        'message': 'foobar_message'
      };

      // Stub out gcloud storage so we can return our dummy file stream
      var pubsub = {
        'topic': function() {}
      };
      var topic = {
        'publish': function() {}
      };

      sinon.stub(gcloud, 'pubsub').returns(pubsub);
      var pubsubStub = sinon.stub(pubsub, 'topic').returns(topic);
      var topicStub = sinon.stub(topic, 'publish').callsArgWith(1,
        'foobar_error');

      // Create a mock context object that will also contain our assertions in the callback
      var context = {
        success: function(val) {
          done('Success was not expected');
        },
        failure: function(err) {
          try {
            chai.expect(err).to.equal('foobar_error');
            done();
          } catch (e) {
            done(e);
          }
        }
      };

      // We need the module to load our mocked versions
      // Use proxyquire to shim in the stubs
      var stubs = {
        'gcloud': gcloud
      };

      // Require the module under test and stub out gcloud
      var mut = proxyquire('../index.js', stubs);

      // Now call the module under test.  Assertions will happen in the callback, 
      // and the test will timeout if the callback is not called.
      mut.publish(context, data);
    });

  describe('Console Tests', function() {

    before(function() {
      // Revert the logger because console.log is skipped for tests
      process.env['NODE_ENV'] = 'prod'
    });

    after(function() {
      process.env['NODE_ENV'] = 'test'
      if (console.log.restore) {
        console.log.restore();
      }
    });

    it('Prints message to console in subscribe', function() {

      mockContext.expects('success').once();

      // Stub out console.log
      var consoleStub = sinon.stub(console, 'log');

      var data = {
        'message': 'foobar_message'
      };

      mut.subscribe(context, data);

      mockContext.verify();
      sinon.assert.calledWith(consoleStub, 'foobar_message');
    });
  });
});