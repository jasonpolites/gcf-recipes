var gcloud = require('gcloud');

var self = {

  /**
   * Counts the number of words in the line.
   */
  'worker': function(context, data) {

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
  },

  /**
   * Reads the source file and fans out to the workers.
   */
  'master': function(context, data) {

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

    var file = data['file'];

    var gcsFile = bucket.file(file);

    var batchSize = data['batch-size'] || 3;

    self._onProcessFile(gcsFile, inTopic, data['out-topic'], batchSize,
      function(err, count) {

        if (err) {
          console.error(err);
          context.failure(err);
          return;
        }

        // The topic we are going to subscribe to
        var outTopic = pubsub.topic(data['out-topic']);

        // Subscribe to the out topic and wait for results
        self._receiveResults(outTopic, count, function(err, result) {

          if (err) {
            console.error(err);
            context.failure(err);
            return;
          }

          context.success('The file ' + file + ' has ' + result +
            ' words');
        });
      });
  },

  /**
   * Processes the source file line-by-line.
   * @param gcsFile The name (path to) of the GCS File to be processed.
   * @param topic The pub/sub topic on to which messages will be published
   * @param strOutTopic The name of the topic to which the worker will ultimately publish.
   * @param batchSize The number of line per batch (default 3)
   * @param callback errback function to receive results in the form ()
   */
  '_onProcessFile': function(gcsFile, topic, strOutTopic, batchSize, callback) {

    // Load the master file using the stream API
    var inStream = gcsFile.createReadStream()
      .on('error', function(err) {
        callback(err);
        return;
      });

    // use the readLine module to read the stream line-by line
    var lineReader = require('readline').createInterface({
      input: inStream
    });

    // Create an array to hold our request promises
    var promises = [];

    // We are going to batch the lines, we could use any number here
    var batch = [];

    // Group lines in to the file into batches and publish to the topic
    lineReader.on('line', function(line) {

      if (batch.length === batchSize) {
        // Send the batch.
        promises.push(self._publishBatch(topic, batch, strOutTopic,
          'worker' + promises.length)); // Give each worker an ID so we can handle duplicates
        batch = [];
      }

      batch.push(line.trim());
    });

    // Invoke the callback once the file has been completely read
    lineReader.on('close', function() {

      // We might have trailing lines in an incomplete batch.
      if (batch.length > 0) {
        promises.push(self._publishBatch(topic, batch, strOutTopic,
          'worker' + promises.length));
      }

      // Wait for all promises to return
      Promise.all(promises).then(
        function(result) {
          console.log('All batches have been published');
          // The result will be an array of return values from the workers.
          callback(null, result.length);
        },
        function(err) {
          callback(err);
        });
    });
  },

  /**
   * Publishes a batch of file lines to the given topic.
   * @param topic The pub/sub topic to which messages will be published.
   * @param batch An array of Strings representing lines in the file.
   * @param strOutTopic The name of the topic to which the worker will ultimately publish.
   * @param workerId A (locally) unique ID for the worker so we can handle at-least-once duplicates from pubsub.
   * @return A Promise that resolves when the publish has completed.
   */
  '_publishBatch': function(topic, batch, strOutTopic, workerId) {
    return new Promise(function(resolve, reject) {
      console.log('Sending batch of ' + batch.length +
        ' lines to worker worker' + workerId);

      topic.publish({
        data: {
          'batch': batch,
          'out-topic': strOutTopic,
          'worker': workerId
        }
      }, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  /**
   * Recieves results on the given topic.
   * @param topic The pub/sub topic in which messages will be received.
   * @param count The number of messages we expect in this batch.
   * @param callback errback function to receive results.
   */
  '_receiveResults': function(topic, count, callback) {

    // Subscribe to the out topic and wait for results
    var options = {
      autoAck: true,
      reuseExisting: true
    };

    // The subscription name can be anything, we're going to re-use it.
    topic.subscribe('mapr-pubsub-subscription', options, function(
      err,
      subscription) {

      if (err) {
        callback(err);
        return;
      }

      var words = 0;

      // Track returned workers to avoid duplicates
      var returned = {};

      var onError = function(err) {
        callback(err);
        return;
      };

      var onMessage = function(message) {

        var worker = message['data']['worker'];

        console.log('Got count of ' + message['data']['count'] +
          ' from worker ' + worker);

        if (returned[worker] !== true) {
          count--;
          returned[worker] = true;
          words += parseInt(message['data']['count']);

          if (count === 0) {
            // Remove listeners to stop pulling for messages.
            subscription.removeListener('message', onMessage);
            subscription.removeListener('error', onError);
            callback(null, words);
          }
        } else {
          console.log('Received duplicate result from worker ' +
            worker);
        }
      };

      // Register listeners to start pulling for messages.
      subscription.on('error', onError);
      subscription.on('message', onMessage);
    });
  }
};

module.exports = self;