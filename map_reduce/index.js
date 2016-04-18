var gcloud = require("gcloud");

// Promise-compartible request module
var req = require('request-promise');

// Use a simple shared key to assert calling authority
var SHARED_KEY = "some_random_high_entropy_string"

/**
 * Counts the number of words in the line
 */
var map = function (context, data) {

  // Simple shared key to authorize the caller
  var key = data['key'];

  if(key !== SHARED_KEY) {
    context.failure("Invalid key");
  } else {
    console.log('Processing line');

    // We expect the data argument to contain a 'line' property
    var line = data['line'];  

    // Just split to count words
    context.success(line.split(/\s+/).length + '');
  }
};

/**
 * Reads the source file and fans out to the mappers
 */
var reduce = function (context, data) {

  // Create a gcs client
  var gcs = gcloud.storage({
    // We're using the API from the same project as the Cloud Function
    projectId: process.env.GCP_PROJECT,
  });

  // Get the location (url) of the map function
  var fnUrl = data['mapFunctionUrl'];

  // Get the bucket containing our source file
  var bucket = gcs.bucket(data['bucket']);

  // Load the master file using the stream API
  console.log('Opening file [' + data['file'] + '] and creating a read stream...');
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
    console.log('Sending line [' + line + '] to map function...');
    promises.push(invoke(fnUrl, line, SHARED_KEY));
  });        

  lineReader.on('close', function () {
    Promise.all(promises).then(function(result) { 

        console.log(result);

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
var invoke = function(url, line, key) {
    // This will return a promise
    return req({
      method: 'POST',
      uri: url,
      body: {
        'line': line,
        'key': key
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
