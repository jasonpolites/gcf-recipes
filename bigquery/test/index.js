var sinon = require('sinon');
var bqUtils = require('../bqutils.js');
var proxyquire = require('proxyquire').noCallThru();

describe('getOrCreateDataset Tests', function() {

  var
    mockBigQuery,
    mockDataset,
    mockTable,
    bigquery = {
      'dataset': function() {}
    },
    dataset = {
      'exists': function() {},
      'create': function() {},
    }

  beforeEach(function() {
    mockBigQuery = sinon.mock(bigquery);
    mockDataset = sinon.mock(dataset);
  });

  afterEach(function() {
    mockBigQuery.restore();
    mockDataset.restore();
  });


  it('Calls callback with error when an error occurs in exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockBigQuery.expects('dataset').once().returns(dataset);
    mockDataset.expects('exists').once().callsArgWith(0, 'foobar_error');

    // We expect that create is NOT called
    mockDataset.expects('create').never();

    // Call the real module
    bqUtils.getOrCreateDataset(bigquery, 'foobar_datasetname', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, 'foobar_error');

    mockBigQuery.verify();
    mockDataset.verify();
  });

  it('Does not create a new dataset when one already exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockBigQuery.expects('dataset').once().returns(dataset);

    // Return false from exists to simulate existence
    mockDataset.expects('exists').once().callsArgWith(0, null, true);

    // We expect that create is NOT called
    mockDataset.expects('create').never();

    // Call the real module
    bqUtils.getOrCreateDataset(bigquery, 'foobar_datasetname', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, null, dataset);

    mockBigQuery.verify();
    mockDataset.verify();
  });

  it('Creates a new dataset when one does not exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockBigQuery.expects('dataset').once().returns(dataset);

    // Return false from exists to simulate non existence
    mockDataset.expects('exists').once().callsArgWith(0, null, false);

    // We expect that create is called
    mockDataset.expects('create').once().callsArgWith(0, null, dataset);

    // Call the real module
    bqUtils.getOrCreateDataset(bigquery, 'foobar_datasetname', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, null, dataset);

    mockBigQuery.verify();
    mockDataset.verify();
  });

  it('Calls callback with error when an error occurs in create', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockBigQuery.expects('dataset').once().returns(dataset);

    // Return false from exists to simulate non existence
    mockDataset.expects('exists').once().callsArgWith(0, null, false);

    // We expect that create is called
    mockDataset.expects('create').once().callsArgWith(0, 'foobar_error');

    // Call the real module
    bqUtils.getOrCreateDataset(bigquery, 'foobar_datasetname', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, 'foobar_error');

    mockBigQuery.verify();
    mockDataset.verify();
  });
});

describe('getOrCreateTable Tests', function() {
  var
    mockDataset,
    mockTable,

    dataset = {
      'table': function() {},
      'createTable': function() {}
    },
    table = {
      'exists': function() {}
    };

  beforeEach(function() {
    mockDataset = sinon.mock(dataset);
    mockTable = sinon.mock(table);
  });

  afterEach(function() {
    mockDataset.restore();
    mockTable.restore();
  });


  it('Calls callback with error when an error occurs in exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockDataset.expects('table').once().returns(table);
    mockTable.expects('exists').once().callsArgWith(0, 'foobar_error');

    // We expect that createTable is NOT called
    mockDataset.expects('createTable').never();

    // Call the real module
    bqUtils.getOrCreateTable(dataset, 'foobar_tablename',
      'foobar_schema', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, 'foobar_error');

    mockDataset.verify();
    mockTable.verify();
  });

  it('Does not create a new table when one already exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock 
    mockDataset.expects('table').once().returns(table);

    // Return false from exists to simulate existence
    mockTable.expects('exists').once().callsArgWith(0, null, true);

    // We expect that create is NOT called
    mockDataset.expects('createTable').never();

    // Call the real module
    bqUtils.getOrCreateTable(dataset, 'foobar_tablename',
      'foobar_schema', callback);

    // We DO expect the callback to return the table
    sinon.assert.calledWith(callback, null, table);

    mockDataset.verify();
    mockTable.verify();
  });

  it('Creates a new table when one does not exists', function() {
    // Create a stub callback
    var callback = sinon.spy();

    var tableName = 'foobar_tablename';
    var schema = 'foobar_schema';

    // Mock the dataset method to return the mock 
    mockDataset.expects('table').once().returns(table);

    // Return false from exists to simulate non existence
    mockTable.expects('exists').once().callsArgWith(0, null, false);

    // We expect that createTable is called
    mockDataset.expects('createTable').once().withArgs(tableName, {
      'schema': schema
    }).callsArgWith(2,
      null,
      table);

    // Call the real module
    bqUtils.getOrCreateTable(dataset, tableName, schema, callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, null, table);

    mockDataset.verify();
    mockTable.verify();
  });

  it('Calls callback with error when an error occurs in create', function() {
    // Create a stub callback
    var callback = sinon.spy();

    // Mock the dataset method to return the mock dataset
    mockDataset.expects('table').once().returns(table);

    // Return false from exists to simulate non existence
    mockTable.expects('exists').once().callsArgWith(0, null, false);

    // We expect that createTable is called with an error
    mockDataset.expects('createTable').once().callsArgWith(2,
      'foobar_error');

    // Call the real module
    bqUtils.getOrCreateTable(dataset, 'foobar_tablename',
      'foobar_schema', callback);

    // We DO expect the callback to return the dataset
    sinon.assert.calledWith(callback, 'foobar_error');

    mockDataset.verify();
    mockTable.verify();
  });

});


describe('waitForJobCompletion Tests', function() {
  var
    mockJob,
    job = {
      'getMetadata': function() {}
    };

  beforeEach(function() {
    mockJob = sinon.mock(job);
  });

  afterEach(function() {
    mockJob.restore();
  });

  it('Returns immediately if job is already DONE', function() {
    var callback = sinon.spy();

    // Create an API response which simulates a status of DONE
    var apiResponse = {
      'status': {
        'state': 'DONE'
      }
    };

    mockJob.expects('getMetadata').once().callsArgWith(0, null,
      apiResponse);

    // Call the real module
    bqUtils.waitForJobCompletion(job, 1, callback);

    // We expect the time waited to be 0
    sinon.assert.calledWith(callback, null, job, 0);

    mockJob.verify();
  });

  it('Waits expected time for job to complete', function(done) {
    var callback = sinon.spy();

    // Create 3 API responses to simulate recursive checks of status
    var responses = [{
      'status': {
        'state': 'RUNNING'
      }
    }, {
      'status': {
        'state': 'RUNNING'
      }
    }, {
      'status': {
        'state': 'DONE'
      }
    }];

    var expectation = mockJob.expects('getMetadata').thrice();

    for (var i = 0; i < responses.length; ++i) {
      expectation.onCall(i).callsArgWith(0,
        null,
        responses[i]);
    }

    // Call the real module
    bqUtils.waitForJobCompletion(job, 100, function() {

      // We don't have a way to tell the callback spy to invoke the moch 'done' callback
      // so just manually invoke the callback with the same arguments that it WOULD have
      // been called with
      callback.apply(this, arguments);

      // We expect the time waited to be 20 because we had two loops of not DONE
      sinon.assert.calledWith(callback, null, job, 20);

      mockJob.verify();

      done();
    });
  });

  it('Fails with timeout if timeout exceeded', function(done) {
    var callback = sinon.spy();

    // Create an API response which simulates a status of not DONE
    var apiResponse = {
      'status': {
        'state': 'RUNNING'
      }
    };

    // The wait time will be 1/10th of the timeout, so we need to loop 10 times
    // before we can expect a timeout.
    var expectation = mockJob.expects('getMetadata').exactly(10).callsArgWith(
      0,
      null, apiResponse);

    // Call the real module
    bqUtils.waitForJobCompletion(job, 100, function() {

      // We don't have a way to tell the callback spy to invoke the moch 'done' callback
      // so just manually invoke the callback with the same arguments that it WOULD have
      // been called with
      callback.apply(this, arguments);

      // We expect a timeout to have occured
      sinon.assert.calledWith(callback,
        'Timeout waiting (100ms) for BigQuery job to complete');

      mockJob.verify();

      done();
    });
  });

  it('Returns with error if job status indicates failure', function() {
    var callback = sinon.spy();

    // Create an API response which simulates a status of DONE
    var apiResponse = {
      'status': {
        'state': 'DONE',
        'errorResult': 'foobar_error' // Just needs to be defined
      }
    };

    mockJob.expects('getMetadata').once().callsArgWith(0, null,
      apiResponse);

    // Call the real module
    bqUtils.waitForJobCompletion(job, 10, callback);

    // We expect a failure result
    sinon.assert.calledWith(callback, 'foobar_error');

    mockJob.verify();
  });

  it('Returns with error if job metadata call fails', function() {
    var callback = sinon.spy();

    mockJob.expects('getMetadata').once().callsArgWith(0,
      'foobar_error');

    // Call the real module
    bqUtils.waitForJobCompletion(job, 10, callback);

    // We expect a failure result
    sinon.assert.calledWith(callback, 'foobar_error');

    mockJob.verify();
  });
});

describe('import Tests', function() {

  var
    utilsMock,
    mockTable,
    table = {
      'import': function() {}
    };

  beforeEach(function() {
    mockTable = sinon.mock(table);
    utilsMock = sinon.mock(bqUtils);
  });

  afterEach(function() {
    mockTable.restore();
    utilsMock.restore();
  });

  it('Imports data to bigquery as expected', function() {

    // We are going to stub out the dependent methods because these are already tested
    var
      bqClient = sinon.stub(),
      dataset = sinon.stub(),
      gcsFile = sinon.stub(),
      job = sinon.stub(),
      datasetName = 'foobar_dataset',
      tableName = 'foobar_table',
      timeout = 100,
      callback = sinon.stub();

    utilsMock.expects('getOrCreateDataset').once().withArgs(bqClient,
      datasetName).callsArgWith(
      2, null,
      dataset);

    utilsMock.expects('getOrCreateTable').once().withArgs(dataset,
      tableName).callsArgWith(
      2, null,
      table);

    mockTable.expects('import').once().withArgs().callsArgWith(1, null,
      job);

    utilsMock.expects('waitForJobCompletion').once().withArgs(job,
      timeout).callsArgWith(
      2, null, job, 0);

    // Call the real module
    bqUtils.import(bqClient, gcsFile, datasetName, tableName, timeout,
      callback);

    utilsMock.verify();
    mockTable.verify();
  });
});

describe('onFileArrived Tests', function() {

  var context = {
    'success': function() {},
    'failure': function() {},
    'done': function() {}
  };

  var contextMock;

  beforeEach(function() {
    contextMock = sinon.mock(context);
  });

  afterEach(function() {
    contextMock.restore();
  });

  describe('test handling of delete events', function() {

    // Declare the mocks outside the test so we ensure they are restored
    // even in the event of a test failure 
    var utilsMock;

    after(function() {
      if (utilsMock) {
        utilsMock.restore();
      }
    });

    it('Exits immediately for file delete events', function() {

      utilsMock = sinon.mock(bqUtils);

      var stubs = {
        './bqutils.js': utilsMock,
      };

      // Require the module under test and stub out bqutils
      var mut = proxyquire('../index.js', stubs);

      // We expect that the function returns immediately if the notification 
      // corresponds to a deleted file.
      var data = {
        'timeDeleted': new Date()
      };

      contextMock.expects('done').once();

      // We expect that create is NOT called
      utilsMock.expects('import').never();

      mut.onFileArrived(context, data);

      contextMock.verify();
      utilsMock.verify();
    });
  });


  describe('test import in onFileArrived', function() {

    // Declare the mocks outside the test so we ensure they are restored
    // even in the event of a test failure
    var
      mut,
      bqUtilsMock,
      mutMock,
      gcloud,
      mutStub,
      config,
      job,
      bigquery,
      storage,
      bucket,
      file;

    beforeEach(function() {

      gcloud = require('gcloud');
      bqUtilsMock = sinon.mock(bqUtils);

      bigquery = {};
      job = {};
      storage = {
        'bucket': function() {}
      };
      bucket = {
        'file': function() {}
      };
      file = {
        'name': 'foobar_file'
      };

      sinon.stub(gcloud, 'bigquery').returns(bigquery);
      sinon.stub(gcloud, 'storage').returns(storage);
      sinon.stub(storage, 'bucket').returns(bucket);
      sinon.stub(bucket, 'file').returns(file);

      // Create a dummy config so we can effectively assert the values
      config = function() {
        return {
          'dataset': 'foobar_dataset',
          'table': 'foobar_table',
          'job_timeout': 42 // Magic number just for this test
        }
      };

      var stubs = {
        'gcloud': gcloud,
        './bqutils.js': bqUtils,
        './config.js': config
      };

      // Require the module under test and stub out dependencies
      mut = proxyquire('../index.js', stubs);

      mutMock = sinon.mock(mut);

    });

    afterEach(function() {
      if (bqUtilsMock) {
        bqUtilsMock.restore();
      }
      if (mutMock) {
        mutMock.restore();
      }

      gcloud.bigquery.restore();
      gcloud.storage.restore();

      if (mutStub) {
        mutStub.restore();
      }
    });

    it(
      'Calls import with correct arguments and marks file as processed on success',
      function() {
        var
          data = {
            'bucket': 'foobar_bucket',
            'name': 'foobar_name',
          };

        // Expect the import method to be called
        // The mock calls the callback as the real method would
        // This simulates expected behavior, but the actual test for this is elsewhere
        bqUtilsMock.expects('import').withArgs(bigquery, file,
            'foobar_dataset',
            'foobar_table', 42)
          .callsArgWith(5, null, job);

        // Stub out the move method, we will test this elsewhere
        mutMock.expects('markAsProcessed').withArgs(file).callsArgWith(
          1, null,
          file, file);

        // Verify that success is called
        contextMock.expects('success').withArgs(
          'foobar_file imported successfully');

        contextMock.expects('failure').never();

        // Call the module
        mut.onFileArrived(context, data);

        // verify the mocks
        contextMock.verify();
        bqUtilsMock.verify();
        mutMock.verify();
      });

    it(
      'Reports failure on context if import failed',
      function() {
        var
          data = {
            'bucket': 'foobar_bucket',
            'name': 'foobar_name',
          };

        // Expect the import method to be called
        // The mock calls the callback as the real method would
        // This simulates expected behavior, but the actual test for this is elsewhere
        bqUtilsMock.expects('import').withArgs(bigquery, file,
            'foobar_dataset',
            'foobar_table', 42)
          .callsArgWith(5, 'foobar_error', job);

        // Stub out the move method, we will test this elsewhere
        mutStub = sinon.stub(mut, 'markAsProcessed').callsArgWith(
          1, null,
          file, file);

        // Verify that failure is called
        contextMock.expects('failure').once().withArgs('foobar_error');
        contextMock.expects('success').never();

        // Call the module
        mut.onFileArrived(context, data);

        // verify the mocks
        contextMock.verify();
        bqUtilsMock.verify();
        mutMock.verify();
      });

    it(
      'Reports failure on context if markAsProcessed failed',
      function() {
        var
          data = {
            'bucket': 'foobar_bucket',
            'name': 'foobar_name',
          };

        // Expect the import method to be called
        // The mock calls the callback as the real method would
        // This simulates expected behavior, but the actual test for this is elsewhere
        bqUtilsMock.expects('import').withArgs(bigquery, file,
            'foobar_dataset',
            'foobar_table', 42)
          .callsArgWith(5, null, job);

        // Stub out the move method, we will test this elsewhere
        mutMock.expects('markAsProcessed').withArgs(file).callsArgWith(
          1, 'foobar_error');

        // Verify that failure is called
        contextMock.expects('failure').once().withArgs(
          'The file foobar_file was successfully sent to BigQuery, but a failure occurred while marking the file as processed.  Check the logs for more details.'
        );
        contextMock.expects('success').never();

        // Call the module
        mut.onFileArrived(context, data);

        // verify the mocks
        contextMock.verify();
        bqUtilsMock.verify();
        mutMock.verify();
      });
  });

  // This is somewhat of a bogus test as the fact that it "moves"
  // the file is largely incidental.  What we really care about is whether
  // the file is subsequently visibly in the source bucket, which would
  // require an integration test
  describe('markAsProcessed test', function() {

    // Declare mocks outside the test so we ensure they are restored
    var
      gcloud,
      destinationBucketName,
      storage,
      destinationBucket,
      apiResponse,
      gcsFile,
      destinationFile,
      callback,
      fileMock,
      config,
      mut

    beforeEach(function() {
      gcloud = require('gcloud');

      destinationBucketName = 'foobar_bucket';

      storage = {
        'bucket': function() {}
      };

      destinationBucket = {};

      // apiResponse can be anything, we just need to make sure it matches
      apiResponse = {
        'response': 'foobar'
      };

      gcsFile = {
        'move': function() {}
      };

      destinationFile = {};

      callback = sinon.spy();

      sinon.stub(gcloud, 'storage').returns(storage);
      sinon.stub(storage, 'bucket').withArgs(destinationBucketName)
        .returns(destinationBucket);

      fileMock = sinon.mock(gcsFile);

      config = function() {
        return {
          'processed_bucket': destinationBucketName
        };
      };

      var stubs = {
        'gcloud': gcloud,
        './config.js': config
      };

      mut = proxyquire('../index.js', stubs);
    });

    afterEach(function() {
      gcloud.storage.restore();
      fileMock.restore();
    });

    it('Moves the file to an alternate bucket', function() {

      fileMock.expects('move').withArgs().callsArgWith(1, null,
        destinationFile, apiResponse);

      mut.markAsProcessed(gcsFile, callback);

      sinon.assert.calledWith(callback, null, gcsFile,
        destinationFile);

      fileMock.verify();
    });

    it('Reports error to callback on move fail', function() {

      fileMock.expects('move').withArgs().callsArgWith(1,
        'foobar_error');

      mut.markAsProcessed(gcsFile, callback);

      sinon.assert.calledWith(callback, 'foobar_error');

      fileMock.verify();
    });

  });
});