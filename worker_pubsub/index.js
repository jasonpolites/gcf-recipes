var gcloud = require('gcloud');

/**
 * Counts the number of words in the line.
 */
var worker = function(context, data) {

  // We expect the data argument to contain a 'line' property.
  var batch = data['batch'];

  // Batch should be an array.
  var count = 0;
  for (var i = 0; i < batch.length; i++) {
    var line = batch[i];
    // Just split to count words.
    count += line.split(/\s+/).length;
  }

  // Create a pubsub client to publish the result
  var pubsub = gcloud.pubsub({
    // We're using the API from the same project as the Cloud Function.
    projectId: process.env.GCP_PROJECT,
  });

  var outTopic = pubsub.topic(data['out-topic']);

  console.log('Worker ' + data['worker'] + ' reporting total count of ' +
      count + ' in batch of size [' + batch.length + ']');

  outTopic.publish({
    data: {
      count: count,
      worker: data['worker']
    }
  }, function(err) {
    if (err) {
      context.failure(err);
      return;
    }
    context.success(count + '');
  });
};

/**
 * Reads the source file and fans out to the workers.
 */
var master = function(context, data) {

  // Create a gcs client
  var gcs = gcloud.storage({
    // We're using the API from the same project as the Cloud Function.
    projectId: process.env.GCP_PROJECT,
  });

  // Create a pubsub client to publish the work and read the results of the workers.
  var pubsub = gcloud.pubsub({
    // We're using the API from the same project as the Cloud Function.
    projectId: process.env.GCP_PROJECT,
  });

  // Get the bucket containing our source file
  var bucket = gcs.bucket(data['bucket']);

  // The topic we are going to publish to
  var inTopic = pubsub.topic(data['in-topic']);

  // The topic we are going to subscribe to
  var outTopic = pubsub.topic(data['out-topic']);

  // Load the master file using the stream API
  var inStream = bucket.file(data['file']).createReadStream()
      .on('error', function(err) {
        context.failure('Error reading file stream for ' + data['file'] + ': ' +
            err.message);
        return;
      });

  // use the readLine module to read the stream line-by line
  var lineReader = require('readline').createInterface({input: inStream});

  // Create an array to hold our request promises
  var promises = [];

  // We are going to batch the lines, we could use any number here
  var batch = [];
  var BATCH_SIZE = 3;
  var batchCount = 0;
  var workerId = 0;

  lineReader.on('line', function(line) {
    if (batch.length === BATCH_SIZE) {
      // Send the batch.
      console.log('Sending batch of ' + batch.length + ' lines to worker worker' + workerId);

      inTopic.publish({
        data: {
          'batch': batch,
          'out-topic': data['out-topic'],
          'worker': 'worker' + (workerId++)
        }
      }, function(err) {
        if (err) {
          context.failure(err);
          return;
        }
      });

      batchCount++;

      batch = [];
    }

    batch.push(line.trim());
  });

  lineReader.on('close', function() {

    // We might have trailing lines in an incomplete batch.
    if (batch.length > 0) {
      console.log('Sending batch of ' + batch.length + ' lines to worker worker' + workerId);

      inTopic.publish({
        data: {
          'batch': batch,
          'out-topic': data['out-topic'],
          'worker': 'worker' + (workerId++)
        }
      }, function(err) {
        if (err) {
          context.failure(err);
          return;
        }
      });

      batchCount++;
    }

    // Subscribe to the out topic and wait for results
    var options = {
      autoAck: true,
      reuseExisting: true
    };

    outTopic.subscribe('mapr-pubsub-subscription', options, function(err, subscription) {

      if (err) {
        console.error(err);
        context.failure(err);
        return;
      }

      var count = 0;

      // Track returned workers to avoid duplicates
      var returned = {};

      var onError = function(err) {
        context.failure(err);
        return;
      };

      var onMessage = function(message) {

        var worker = message['data']['worker'];

        console.log('Got count of ' + message['data']['count'] + ' from worker ' + worker);

        if (returned[worker] !== true) {
          batchCount--;
          returned[worker] = true;
          count += parseInt(message['data']['count']);

          if (batchCount === 0) {
            // Remove listeners to stop pulling for messages.
            subscription.removeListener('message', onMessage);
            subscription.removeListener('error', onError);
            context.success(
                'The file ' + data['file'] + ' has ' + count + ' words');
          }
        } else {
          console.log('Recieved duplicate result from worker ' + worker);
        }
      };

      // Register listeners to start pulling for messages.
      subscription.on('error', onError);
      subscription.on('message', onMessage);
    });
  });
};


module.exports = {
  worker: worker,
  master: master
};
