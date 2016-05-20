// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

var self = {

  // Imports a GCS file into bigquery
  'import': function(bqClient, gcsFile, strDatasetName, strTableName,
    strSchema,
    timeout, callback) {

    self.getOrCreateDataset(bqClient, strDatasetName, function(err, dataset) {
      if (err) {
        callback(err);
        return;
      }

      self.getOrCreateTable(dataset, strTableName, strSchema, function(
        err,
        table) {
        if (err) {
          callback(err);
          return;
        }

        logger.log('Importing data from ' + gcsFile.name + ' into ' +
          dataset.id + '/' + table.id + '...');

        table.import(gcsFile, function(err, job, apiResponse) {
          if (err) {
            callback(err);
            return;
          }

          logger.log('Data import job created');

          // Wait for the import job to complete.
          // This is optional.  If you don't care about blocking while data is
          // imported you could simply return here without the wait.
          self.waitForJobCompletion(job, timeout, callback);
        });
      });
    });
  },

  // Gets or creates the BigQuery dataset
  'getOrCreateDataset': function(bqClient, strDatasetName, callback) {
    var dataset = bqClient.dataset(strDatasetName);

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
  },

  // Gets or creates the bigquery table
  'getOrCreateTable': function(dataset, strTableName, strSchema, callback) {
    var table = dataset.table(strTableName);

    // Check to see if this table exists
    table.exists(function(err, exists) {
      if (err) {
        callback(err);
        return;
      }

      if (!exists) {
        // We need to set the schema on the table
        var options = {
          'schema': strSchema
        };

        logger.log('Creating table with schema ' + options.schema)

        dataset.createTable(strTableName, options, function(err,
          table, apiResponse) {
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
  },

  // Waits up to timeout milliseconds for the given job to complete
  'waitForJobCompletion': function(job, timeout, callback) {
    var waitTime = timeout / 10;
    var timeWaited = 0;

    // Start a loop to check the status of the operation.
    checkJobStatus();

    function checkJobStatus() {

      job.getMetadata(function(err, apiResponse) {

        if (err) {
          callback(err);
          return;
        }

        if (apiResponse.status.state !== 'DONE') {

          timeWaited += waitTime;

          if (timeWaited >= timeout) {
            callback('Timeout waiting (' + timeout +
              'ms) for BigQuery job to complete');
          }

          // Job has not completed yet. Check again.
          setTimeout(checkJobStatus, waitTime);
          return;
        }

        // Job completed but it may have still failed.
        // Check for an error condition
        if (apiResponse.status.errorResult) {
          callback(apiResponse.status.errorResult);
          return;
        }

        // We completed successfully!
        callback(null, job, timeWaited);
      });
    }
  }
};

// Export all functions
module.exports = self;