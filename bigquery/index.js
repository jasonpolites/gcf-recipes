var gcloud = require('gcloud');

// Import the configuration required for this function.
var config = require('./config.js')(process.env.GCP_PROJECT);

// Keep a reference to the BigQuery client
// This is OK because the function is stateless
var bigquery = null;
var storage = null;

// Called when file is uploaded to a GCS bucket
var onFileArrived = function(context, data) {

  // Check the type of mutation
  // Schema for GCS mutation events is at:
  // https://cloud.google.com/storage/docs/json_api/v1/objects#resource
  if (data.hasOwnProperty('timeDeleted')) {
    // This is a deletion event, we don't want to process this
    context.done();
    return;
  }

  console.log('onFileArrived triggered');

  // The location of the file in GCS will be in the event
  var storage = _getStorageClient();
  var bucket = storage.bucket(data['bucket']);
  var file = bucket.file(data['name']);

  console.log('Sending file ' + file.name + ' to BigQuery...');

  // Send this file to bigquery
  _sendToBigQuery(file, function(err, job) {

    if (err) {
      console.error(err);
      context.failure(err);
      return;
    }

    console.log('File imported successfully, marking as done...');

    // Mark this file as processed so we know it was successfully handled
    // and we don't risk processing it again.
    _markAsProcessed(file, function(err, oldFile, newFile) {
      if (err) {
        console.error(err);
        context.failure('The file ' + oldFile.name + ' was successfully sent to ' +
            'BigQuery, but a failure occurred while marking the file as ' +
            'processed.  Check the logs for more details.');
        return;
      }

      // and we're done
      console.log('File marked as done.  Function complete.');
      context.success(oldFile.name + ' imported successfully');
    });
  });
};

// Marks the given file as processed so it's not processed again
var _markAsProcessed = function(gcsFile, callback) {
  var storage = _getStorageClient();
  var destination = storage.bucket(config['processed_bucket']);

  gcsFile.move(destination, function(err, destinationFile, apiResponse) {
    if (err) {
      callback(err);
      return;
    }
    callback(null, gcsFile, destinationFile);
  });
};

// Sends a GCS File to BigQuery
var _sendToBigQuery = function(gcsFile, callback) {

  var bigquery = _getBQClient();

  _getOrCreateDataset(bigquery, function(err, dataset) {
    if (err) {
      callback(err);
      return;
    }

    _getOrCreateTable(dataset, function(err, table) {
      if (err) {
        callback(err);
        return;
      }

      console.log('Importing data from ' + gcsFile.name + ' into ' + dataset.id + '/' + table.id + '...');

      table.import(gcsFile, function(err, job, apiResponse) {
        if (err) {
          callback(err);
          return;
        }

        console.log('Data import job created');
        // console.log(apiResponse);

        // Wait for the import job to complete.
        // This is optional.  If you don't care about blocking while data is
        // imported you could simply return here without the wait.
        _waitForJobCompletion(job, config['job_timeout'], callback);
      });
    });
  });
};

// Waits up to timeout milliseconds for the given job to complete
var _waitForJobCompletion = function(job, timeout, callback) {
  var waitTime = timeout / 10;
  var timeWaited = 0;

  // Start a loop to check the status of the operation.
  checkJobStatus();

  function checkJobStatus() {
    // console.log('Checking status of BigQuery job ' + job.id);

    job.getMetadata(function(err, apiResponse) {
      if (err) {
        callback(err);
        return;
      }

      // console.log('BigQuery job ' + job.id + ' has status of ' + apiResponse.status.state);

      if (apiResponse.status.state !== 'DONE') {
        timeWaited += waitTime;

        if (timeWaited >= timeout) {
          callback('Timeout waiting (' + timeout + 'ms) for BigQuery job to complete');
        }

        // Job has not completed yet. Check again.
        setTimeout(checkJobStatus, waitTime);
        return;
      }

      // Job completed but it may have still failed.
      // Check for an error condition
      if (apiResponse.status.errorResult) {
        console.error(apiResponse.status);
        callback(apiResponse.status.errorResult);
        return;
      }

      // We completed successfully!
      callback(null, job);
    });
  }
};

// Gets or creates a BigQuery client
var _getBQClient = function() {
  if (bigquery === null) {
    bigquery = gcloud.bigquery({
      // We're using the API from the same project as the Cloud Function
      projectId: process.env.GCP_PROJECT,
    });
  }
  return bigquery;
};

// Gets or creates a storage client
var _getStorageClient = function() {
  if (storage === null) {
    storage = gcloud.storage({
      // We're using the API from the same project as the Cloud Function
      projectId: process.env.GCP_PROJECT,
    });
  }
  return storage;
};

// Gets or creates the BigQuery dataset
var _getOrCreateDataset = function(bigquery, callback) {
  var dataset = bigquery.dataset(config['dataset']);

  // Check to see if this dataset exists
  dataset.exists(function(err, exists) {
    if (err) {
      callback(err);
      return;
    }

    if (!exists) {
      dataset.create(function(err, dataset, apiResponse) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, dataset);
      });
    } else {
      callback(null, dataset);
    }
  });
};

// Gets or creates the bigquery table
var _getOrCreateTable = function(dataset, callback) {
  var table = dataset.table(config['table']);

  // Check to see if this table exists
  table.exists(function(err, exists) {
    if (err) {
      callback(err);
      return;
    }

    if (!exists) {
      // We need to set the schema on the table
      var options = {
        schema: config['schema']
      };

      dataset.createTable(config['table'], options, function(err, table, apiResponse) {
        if (err) {
          callback(err);
          return;
        }
        callback(null, table);
      });
    } else {
      callback(null, table);
    }
  });
};

module.exports = {

  /**
   * Called when a file is written to the nominated cloud storage bucket.
   */
  onFileArrived: onFileArrived,
};
