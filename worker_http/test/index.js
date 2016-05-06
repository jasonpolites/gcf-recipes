var chai = require('chai');
var sinon = require('sinon');
require('sinon-as-promised');
var proxyquire = require('proxyquire').noCallThru();

var SHARED_KEY = 'some_random_high_entropy_string';

describe('Master Worker Tests', function() {

  it('Verifies that failure is called without a valid shared key', function () {
    var mut = require('../index.js');

    var data = {};

    var context = {
      success: function(val) {},
      failure: function(val) {}
    };

    var mock = sinon.mock(context);
    mock.expects('failure').once().withArgs('Invalid key');

    mut.worker(context, data);

    mock.verify();

  });

  it('Counts words in a line correctly', function() {

    var mut = require('../index.js');

    var line = 'Shall I compare thee to a summer\'s day?';
    var data = {
      batch: [line],
      key: SHARED_KEY
    };
    var value;
    var context = {
      success: function(val) {
        value = val;
      },
      failure: function(val) {
        throw new Error(val);
      }
    };
    mut.worker(context, data);
    chai.expect(value).to.equal('8');
  });

  it('Loads a file and correctly calls worker processes', function (done) {

    // Manually create sample data to represent the 'file'
    var sample_data = 'The quick brown fox\njumps over\nthe lazy dog';

    // Create a mock stream for our sample data.  This will allow the module
    // to "think" it's streaming the data from a file
    var stream = require('stream');
    var dummyStream = new stream.Readable();
    dummyStream.push(sample_data);
    dummyStream.push(null);

    // Mock the data argument.  Use a batch size of 1 so we process each line separately
    var data = {
      'batch_size': 1,
      'file': 'foobar_file',
      'bucket': 'foobar_bucket',
      'workerFunctionUrl': 'foobar_url'
    };    

    // Stub out gcloud storage so we can return our dummy file stream
    var gcloud = require('gcloud');
    var storage = {'bucket': function (){}};
    var bucket = {'file': function (){}};
    var file = {'createReadStream': function (){}};
    var storageFn = sinon.stub(gcloud, 'storage').returns(storage);
    var bucketFn = sinon.stub(storage, 'bucket').returns(bucket);
    var fileFn = sinon.stub(bucket, 'file').returns(file);

    // Return our dummy stream from the stubbed file
    sinon.stub(file, 'createReadStream').returns(dummyStream);

    // Mock the request-promise library so we don't make any actual HTTP calls out.
    // The '33' magic number here is just a dummy result.  It's saying that every batch of lines has 33 words
    var req = sinon.mock(req).resolves('33');

    // Our sample data has 3 lines and we have a batch size of 3, so we should expect 3 requests
    req.thrice();

    // Create a mock context object
    var context = {
      success: function (val) {
        try {

          // We expected our worker function to be called 3 times, and our mock
          // request promise resolves to 33 every time
          chai.expect(val).to.equal('The file foobar_file has 99 words');
          req.verify();

          // We now know that the mock was called 3 times, verify the arguments
          chai.expect(
            req.getCall(0).args[0].body.batch[0]).to.equal(
            'The quick brown fox');
          chai.expect(
            req.getCall(1).args[0].body.batch[0]).to.equal('jumps over');
          chai.expect(
            req.getCall(2).args[0].body.batch[0]).to.equal('the lazy dog');

          done();

        } catch (e) {
          done(e);
        }
      },
      failure: function (err) {
        done(err);
      }
    };

    // We need the module to load our mocked versions
    // Use proxyquire to shim in the stubs
    var stubs = {
      'gcloud': gcloud, 
      'request-promise': req
    };

    // Require the module under test and stub out gcloud
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.master(context, data);
  });
});