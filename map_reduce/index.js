var gcloud = require("gcloud");

// Promise-compartible request module
var req = require('request-promise');

// Node promise polyfill
var Promise = require('promise');

module.exports = {

  /**
   * Counts the number of words in the line
   */
  "map" : function (context, data) {
    // We expect the data argument to contain a 'line' property
    var line = data['line'];

    // Just split to count words
    context.success(line.split(/\s+/).length + '');
  },

  /**
   * Reads the source file and fans out to the mappers
   */
  "reduce" : function (context, data) {

    // Create a gcs client
    var gcs = gcloud.storage({
      // We're using the API from the same project as the Cloud Function
      projectId: process.env.GCP_PROJECT
    });

    // Get the location (url) of the map function
    var fnUrl = data['mapFunctionUrl'];

    // Get the bucket containing our source file
    var bucket = gcs.bucket(data['bucket']);

    // Load the master file using the stream API
    var inStream = bucket.file(data['file']).createReadStream();

    // use the readLine module to read the stream line-by line
    var lineReader = require('readline').createInterface({
      input: inStream
    });

    // Create an array to hold our request promises
    var promises = [];

    lineReader.on('line', function (line) {
      // You could batch the lines here to send more than one to each mapper
      // but for simplicity we're just going to send each line
      promises.push(invoke(fnUrl, line));
    });        

    lineReader.on('close', function () {
      Promise.all(promises).then(function(err, result) {
        if(err) {
          context.failure(err);
        } else {
          // The result will be an array of return values from the mappers
          var count = 0;
          for(var i = 0; i < result.length; ++i) {
            count += parseInt(result[i]);
          }
          context.success(count);
        }
      });
    });       
  }
}

// Invokes another Cloud Function
function invoke(url, payload) {
  // This will return a promise
  return req({
    method: 'POST',
    uri: url,
    body: {
      'line': payload
    },
    json: true
  });
}
