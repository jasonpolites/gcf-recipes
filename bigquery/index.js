var gcloud = require('gcloud');

// Import the configuration required for this function.
var config = require('./config.js')(process.env.GCP_PROJECT);

// Import the bqutils module
var bqutils = require('./bqutils.js');

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
  var bigquery = _getBQClient();
  var storage = _getStorageClient();
  var bucket = storage.bucket(data['bucket']);
  var file = bucket.file(data['name']);

  console.log('Sending file ' + file.name + ' to BigQuery...');

  // Send this file to bigquery
  bqutils.import(bigquery, file, config['dataset'], config['table'],
    config['job_timeout'],
    function(err, job) {

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
          context.failure('The file ' + oldFile.name +
            ' was successfully sent to ' +
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

module.exports = {

  /**
   * Called when a file is written to the nominated cloud storage bucket.
   */
  onFileArrived: onFileArrived,
};