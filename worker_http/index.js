var gcloud = require('gcloud');

// Promise-compartible request module.
var req = require('request-promise');

// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

// Use a simple shared key to assert calling authority.
var SHARED_KEY = 'some_random_high_entropy_string';

/**
 * Counts the number of words in the line.
 */
var worker = function(context, data) {

  // Simple shared key to authorize the caller
  var key = data['key'];
  if (key !== SHARED_KEY) {
    context.failure('Invalid key');
    return;
  }

  // We expect the data argument to contain a 'line' property.
  var batch = data['batch'];

  // Batch should be an array.
  var count = 0;
  for (var i = 0; i < batch.length; i++) {
    var line = batch[i];

    // Just split to count words.
    count += line.split(/\s+/).length;
  }

  logger.log(
    'Total [' + count + '] words in batch of size [' + batch.length + ']');

  context.success(count + '');
};

/**
 * Reads the source file and fans out to the mappers.
 */
var master = function(context, data) {

  // Create a gcs client
  var gcs = gcloud.storage({
    // We're using the API from the same project as the Cloud Function.
    projectId: process.env.GCP_PROJECT,
  });

  // Get the location (url) of the map function
  var fnUrl = data['workerFunctionUrl'];

  // Get the bucket containing our source file
  var bucket = gcs.bucket(data['bucket']);

  // Load the master file using the stream API
  logger.log(
    'Opening file [' + data['file'] + '] and creating a read stream...');
  var inStream = bucket.file(data['file']).createReadStream()
    .on('error', function(err) {
      context.failure('Error reading file stream for ' + data['file'] +
        ': ' + err.message);
      return;
    });

  // use the readLine module to read the stream line-by line
  logger.log('Got stream, reading file line-by-line...');
  var lineReader = require('readline').createInterface({
    input: inStream
  });

  // Create an array to hold our request promises
  var promises = [];

  // We are going to batch the lines, we could use any number here
  var batch = [];
  var BATCH_SIZE = data['batch_size'] || 3; // 3 is defauld

  lineReader.on('line', function(line) {
    if (batch.length === BATCH_SIZE) {
      // Send the batch.
      promises.push(invoke(fnUrl, batch, SHARED_KEY));
      batch = [];
    }

    batch.push(line.trim());
  });

  lineReader.on('close', function() {

    // We might have trailing lines in an incomplete batch.
    if (batch.length > 0) {
      promises.push(invoke(fnUrl, batch, SHARED_KEY));
    }

    Promise.all(promises).then(
      function(result) {
        logger.log('All workers have returned');
        // The result will be an array of return values from the workers.
        var count = 0;
        for (var i = 0; i < result.length; ++i) {
          count += parseInt(result[i]);
        }

        context.success(
          'The file ' + data['file'] + ' has ' + count + ' words');

      },
      function(err) {
        logger.error(err);
        context.failure(err);
      });
  });
};


/**
 * Invokes another Cloud Function.
 */
var invoke = function(url, batch, key) {

  // This will return a promise
  return req({
    method: 'POST',
    uri: url,
    body: {
      batch: batch,
      key: key,
    },
    headers: {
      accept: '*/*',
    },
    json: true,
  });
};

module.exports = {
  worker: worker,
  master: master,
  invoke: invoke,
};