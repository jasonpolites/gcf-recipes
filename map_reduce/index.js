var gcloud = require("gcloud");

// Promise-compartible request module
var req = require('request-promise');

/**
 * Counts the number of words in the line
 */
var map = function (context, data) {
  // We expect the data argument to contain a 'line' property
  var line = data['line'];

  // Just split to count words
  context.success(line.split(/\s+/).length + '');
};

/**
 * Reads the source file and fans out to the mappers
 */
var reduce = function (context, data) {

  // Create a gcs client
  var gcs = gcloud.storage();

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
    Promise.all(promises).then(function(result) { 
        // The result will be an array of return values from the mappers
        var count = 0;
        for(var i = 0; i < result.length; ++i) {
          count += parseInt(result[i]);
        }
        context.success("The file " + data['file'] + " has " + count + " words");
    }, function(err) {
        console.error("Error!")
        context.failure(err);
    });
  });       
};

// Invokes another Cloud Function
var invoke = function(url, payload) {
    // This will return a promise
    return req({
      method: 'POST',
      uri: url,
      body: {
        'line': payload
      },
      headers: {
        "accept": "*/*"
      },      
      json: true
    });
};

module.exports = {
  "map" : map,
  "reduce" : reduce,
  "invoke" : invoke
}
