var chai = require('chai');
var sinon = require('sinon');
require('sinon-as-promised');
var proxyquire = require('proxyquire').noCallThru();
var testUtils = require('./testutils');

describe('Master Worker Tests - Pub/Sub', function() {

  var
    sandbox,
    mut,
    mutMock,
    gcloud,
    readLine,
    context,
    contextMock;


  sandbox = sinon.sandbox.create();

  beforeEach(function() {

    gcloud = {
      pubsub: function() {},
      storage: function() {}
    };
    readLine = require('readline');

    context = {
      success: function() {},
      failure: function() {}
    };

    var stubs = {
      'gcloud': gcloud,
      'readLine': readLine
    };

    // Require the module under test and stub out dependencies
    mut = proxyquire('../index.js', stubs);

    contextMock = sandbox.mock(context);
    mutMock = sandbox.mock(mut);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Public Interface Tests', function() {

    // Declare the mocks outside the test so we ensure they are restored
    // even in the event of a test failure
    var
      pubsub,
      pubsubMock,
      inTopic,
      outTopic,
      inTopicMock,
      outTopicMock,
      storage,
      bucket,
      file;

    beforeEach(function() {

      pubsub = {
        'topic': function() {}
      };
      inTopic = {
        'publish': function() {},
        'subscribe': function() {}
      };
      outTopic = {
        'publish': function() {},
        'subscribe': function() {}
      };
      storage = {
        'bucket': function() {}
      };
      bucket = {
        'file': function() {}
      };
      file = {
        'name': 'foobar_file'
      };

      sandbox.stub(gcloud, 'pubsub').returns(pubsub);
      sandbox.stub(gcloud, 'storage').returns(storage);
      sandbox.stub(storage, 'bucket').returns(bucket);
      sandbox.stub(bucket, 'file').returns(file);

      pubsubMock = sandbox.mock(pubsub);
      inTopicMock = sandbox.mock(inTopic);
      outTopicMock = sandbox.mock(outTopic);
    });

    it('Master processes source file and waits for results', function() {

      var
        data = {
          'bucket': 'foobar_bucket',
          'in-topic': 'foobar_topic_in',
          'out-topic': 'foobar_topic_out',
          'file': 'foobar_file',
          'batch-size': 42
        },
        count = 69,
        words = 2001

      pubsubMock.expects('topic').once().withArgs('foobar_topic_in')
        .returns(
          inTopic);
      pubsubMock.expects('topic').once().withArgs(
        'foobar_topic_out').returns(
        outTopic);

      mutMock.expects('_onProcessFile').withArgs(
        file, inTopic, 'foobar_topic_out', 42).callsArgWith(4,
        null,
        count);

      mutMock.expects('_receiveResults').withArgs(
        outTopic, count).callsArgWith(2, null, words);

      contextMock.expects('success').once().withArgs(
        'The file foobar_file has 2001 words');
      contextMock.expects('failure').never();

      mut.master(context, data);

      pubsubMock.verify();
      mutMock.verify();
      contextMock.verify();
    });

    it('Master reports failure to context if file processing fails',
      function() {
        var
          data = {
            'bucket': 'foobar_bucket',
            'in-topic': 'foobar_topic_in',
            'out-topic': 'foobar_topic_out',
            'file': 'foobar_file',
            'batch-size': 42
          },
          error = 'foobar_error';

        pubsubMock.expects('topic').once().withArgs('foobar_topic_in')
          .returns(
            inTopic);

        mutMock.expects('_onProcessFile').withArgs(
          file, inTopic, 'foobar_topic_out', 42).callsArgWith(4,
          error);

        contextMock.expects('failure').once().withArgs(error);
        contextMock.expects('success').never();

        mut.master(context, data);

        mutMock.verify();
        contextMock.verify();
      });

    it('Master reports failure to context if receiving results fails',
      function() {
        var
          data = {
            'bucket': 'foobar_bucket',
            'in-topic': 'foobar_topic_in',
            'out-topic': 'foobar_topic_out',
            'file': 'foobar_file',
            'batch-size': 42
          },
          count = 69,
          error = 'foobar_error';

        pubsubMock.expects('topic').once().withArgs('foobar_topic_in')
          .returns(
            inTopic);

        pubsubMock.expects('topic').once().withArgs(
          'foobar_topic_out').returns(
          outTopic);

        mutMock.expects('_onProcessFile').withArgs(
          file, inTopic, 'foobar_topic_out', 42).callsArgWith(4,
          null,
          count);

        mutMock.expects('_receiveResults').withArgs(
          outTopic, count).callsArgWith(2, error);

        contextMock.expects('failure').once().withArgs(error);
        contextMock.expects('success').never();

        mut.master(context, data);

        mutMock.verify();
        contextMock.verify();
      });

    it('Worker publishes correct count to expected topic', function() {

      var line = 'Shall I compare thee to a summer\'s day?';

      var outTopicName = 'foobar_out_topic';

      var data = {
        'batch': [line],
        'out-topic': outTopicName,
        'worker': 'foobar_worker'
      };

      var expected = {
        data: {
          count: 8,
          worker: 'foobar_worker'
        }
      };

      pubsubMock.expects('topic').once().withArgs(outTopicName).returns(
        outTopic);
      outTopicMock.expects('publish').once().withArgs(expected).callsArg(
        1);
      contextMock.expects('success').once().withArgs('8');
      contextMock.expects('failure').never();

      mut.worker(context, data);

      pubsubMock.verify();
      outTopicMock.verify();
      contextMock.verify();
    });


    it('Worker fails if pubsub publish fails', function() {

      var err = 'foobar_error';

      var line = 'Shall I compare thee to a summer\'s day?';

      var outTopicName = 'foobar_out_topic';

      var data = {
        'batch': [line],
        'out-topic': outTopicName,
        'worker': 'foobar_worker'
      };

      var expected = {
        data: {
          count: 8,
          worker: 'foobar_worker'
        }
      };

      pubsubMock.expects('topic').once().withArgs(outTopicName).returns(
        outTopic);
      outTopicMock.expects('publish').once().withArgs(expected).callsArgWith(
        1, err);
      contextMock.expects('failure').once().withArgs(err);
      contextMock.expects('success').never();

      mut.worker(context, data);

      pubsubMock.verify();
      outTopicMock.verify();
      contextMock.verify();
    });
  });

  describe('Internal Method Tests', function() {

    it(
      'All lines in the file are correctly published in batches to the correct topic',
      function(done) {

        // Manually create sample data to represent the 'file'
        var sample_data =
          'The quick brown fox\njumps over\nthe lazy dog';

        // Create a mock stream for our sample data.  This will allow the module
        // to "think" it's streaming the data from a file
        var stream = require('stream');
        var dummyStream = new stream.Readable();
        dummyStream.push(sample_data);
        dummyStream.push(null);

        // Mock the GCS File to return the dummy stream
        var gcsFile = {
          'createReadStream': function() {}
        };

        // Just create a topic to passthrough (_publishBatch will resolve immediately)
        var topic = {};

        var strOutTopic = 'foobar_topic_out';

        var gcsFileMock = sinon.mock(gcsFile);

        gcsFileMock.expects('createReadStream').once().returns(
          dummyStream);

        // Mock out the _publishBatch method to immediately resolve
        var expectedBatches = [
          ['The quick brown fox'],
          ['jumps over'],
          ['the lazy dog']
        ];

        for (var i = 0; i < expectedBatches.length; ++i) {
          mutMock.expects('_publishBatch').once().withArgs(topic,
            expectedBatches[i], strOutTopic, 'worker' + i).resolves();
        }

        // Call the real module
        mut._onProcessFile(gcsFile, topic, strOutTopic, 1, function(
          err, val) {

          if (err) {
            done(err);
            return;
          }

          try {
            chai.expect(val).to.equal(3);
            gcsFileMock.verify();
            mutMock.verify();
            done();
          } catch (e) {
            done(e);
          }
        });
      });

    describe('ReadStream error tests', function() {

      var lineReader = testUtils.createEmitter();

      before(function() {
        sinon.stub(readLine, 'createInterface').returns(
          lineReader);
      });
      after(function() {
        readLine.createInterface.restore();
      });

      it('Correctly reports error when reading file stream fails',
        function(done) {

          // Mock the gcs file to return a dummy emitter
          var gcsFile = {
            'createReadStream': function() {}
          };
          var fileMock = sinon.mock(gcsFile);
          // Just create a dummy emitter for the stream to simulate the error
          var inStream = testUtils.createEmitter();

          var error = 'foobar_error';

          fileMock.expects('createReadStream').returns(inStream);

          // Call the module and add our assertions to the callback
          mut._onProcessFile(gcsFile, {}, '', 0, function(err) {
            try {
              chai.expect(err).to.equal(error);
              fileMock.verify();
              done();
            } catch (e) {
              done(e);
            }
          });

          // Now publish an error to the dummy emitter
          // The test will timeout if the callback is not called
          inStream.emit('error', error);
        });
    });

    it('Publishes the correct data to the correct topic in a Promise',
      function(done) {

        var
          topic,
          topicMock,
          batch = ['foobar_line'],
          strOutTopic = 'foobar_topic',
          workerId = 'foobar_worker',
          expectedData;

        topic = {
          'publish': function() {}
        };

        expectedData = {
          data: {
            'batch': batch,
            'out-topic': strOutTopic,
            'worker': workerId
          }
        };

        topicMock = sinon.mock(topic);
        topicMock.expects('publish').withArgs(expectedData).callsArg(
          1);

        // Now call the real module, this should return a promise
        var p = mut._publishBatch(topic, batch, strOutTopic, workerId);

        // now invoke the promise
        p.then(function() {
          try {
            topicMock.verify();
            done();
          } catch (e) {
            done(e)
          }
        }).catch(function(e) {
          done(e)
        })
      });

    it(
      'Correctly responds to messages on the topic to which workers are publishing',
      function(done) {

        // The subscription object returned by gcloud is a Node emitter
        // We want to test that the subscription created in the module correctly 
        // handles messages written to the topic.  The simplest way to validate this
        // is to create a dummy emitter and publish events to it.
        var subscription = testUtils.createEmitter();

        // Ensure we are creating a subscription with the correct options
        var expectedOptions = {
          autoAck: true,
          reuseExisting: true
        };

        var outTopic = {
          'subscribe': function() {}
        };

        var outTopicMock = sinon.mock(outTopic);

        // We have a subscription object, use this in the simulated callback to the subscribe() 
        // invocation on the topic.
        outTopicMock.expects('subscribe').withArgs(
            sinon.match.string, // We don't really care what the name is
            expectedOptions,
            sinon.match.func)
          .callsArgWith(2, null, subscription);

        // Now create a mock of the the subscription to verify the method calls
        var subscriptionMock = sinon.mock(subscription);

        // Verify that subscriptions are removed at the end.  
        // We will test the creation and behavior of handlers using 
        // the dummy emitter
        subscriptionMock.expects('removeListener').withArgs('error',
          sinon.match.func);
        subscriptionMock.expects('removeListener').withArgs('message',
          sinon.match.func);

        // We are going to publish 3 messages to the "topic" (emitter)
        var
          counts = [42, 69, 2001],
          callback = sinon.mock();

        // Shortcut SUM function
        var expectedSum = counts.reduce(function(a, b) {
          return a + b;
        }, 0)

        // Expect the callback with the sum of all messages
        callback.withArgs(null, expectedSum);

        // Now call the actual module method
        mut._receiveResults(outTopic, counts.length, function(err,
          words) {

          try {
            // We expect the count to be calculated correctly
            chai.expect(words).to.equal(expectedSum);

            // We expect these events to be processed by the emitter callbacks
            outTopicMock.verify();
            subscriptionMock.verify();

            done();

          } catch (e) {
            done(e);
          }
        });

        // Now we want to "publish" events
        for (var i = 0; i < counts.length; ++i) {
          subscription.emit('message', {
            data: {
              worker: 'worker' + i,
              count: counts[i]
            }
          });
        }

        // Now send another that is a duplicate to verify that duplicates are handled
        i--;
        subscription.emit('message', {
          data: {
            worker: 'worker' + i,
            count: counts[i]
          }
        });
      });
  });
});