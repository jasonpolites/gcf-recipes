var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Cloud Storage Tests', function() {

  var mut = require('../index.js');

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
  });

  it('Call fails without a bucket name', function() {

    mockContext.expects('failure').once().withArgs(
      'Bucket not provided. Make sure you have a \'bucket\' property in your request'
    );

    var data = {
      'file': 'foobar_file'
    };

    mut.wordCount(context, data);

    mockContext.verify();
  });

  it('Call fails without a file name', function() {

    mockContext.expects('failure').once().withArgs(
      'Filename not provided. Make sure you have a \'file\' property in your request'
    );

    var data = {
      'bucket': 'foobar_bucket'
    };

    mut.wordCount(context, data);

    mockContext.verify();
  });

  it('Load a file and correctly counts the words', function(done) {

    // Manually create sample data to represent the 'file'
    var sample_data = 'The quick brown fox\njumps over\nthe lazy dog';

    // Data can be anything, our mocks will load a mock file no matter what
    var data = {
      'bucket': 'foobar_bucket',
      'file': 'foobar_file'
    };

    // Create a mock stream for our sample data.  This will allow the module
    // to "think" it's streaming the data from a file
    var stream = require('stream');
    var dummyStream = new stream.Readable();
    dummyStream.push(sample_data);
    dummyStream.push(null);

    // Stub out gcloud storage so we can return our dummy file stream
    var gcloud = require('gcloud');
    var storage = {
      'bucket': function() {}
    };
    var bucket = {
      'file': function() {}
    };
    var file = {
      'createReadStream': function() {}
    };

    sinon.stub(gcloud, 'storage').returns(storage);
    var storageStub = sinon.stub(storage, 'bucket').returns(bucket);
    var bucketStub = sinon.stub(bucket, 'file').returns(file);

    // Mock the storage instance so we can assert that it was called with 
    // the correct bucket name
    // var storageSpy = sinon.spy(storage, 'bucket');

    // Return our dummy stream from the stubbed file
    sinon.stub(file, 'createReadStream').returns(dummyStream);

    // Create a mock context object that will also contain our assertions in the callback
    var context = {
      success: function(val) {
        try {

          // Assert that the properties of the data object were correctly used to
          // load the file
          sinon.assert.calledWith(storageStub, 'foobar_bucket');
          sinon.assert.calledWith(bucketStub, 'foobar_file');

          // Our sample string has 9 words
          chai.expect(val).to.equal(
            'The file foobar_file has 9 words');

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
    mut.wordCount(context, data);

  });

});