var gcloud = require("gcloud");

module.exports = {
  "wordCount" : function (context, data) {
    var bucketName = data['bucket'];
    var fileName = data['file'];

  if(!bucketName) {
      context.failure("Bucket not provided.  Make sure you have a 'bucket' property in your request");
    } else {
      if(!fileName) {
        context.failure("Filename not provided.  Make sure you have a 'file' property in your request");
      } else {
        // Create a gcs client
        var gcs = gcloud.storage({
          // We're using the API from the same project as the Cloud Function
          projectId: process.env.GCP_PROJECT,
        });   
        var bucket = gcs.bucket(bucketName); 
        var file = bucket.file(fileName);
        var count = 0;

        // use the readLine module to read the stream line-by line
        var lineReader = require('readline').createInterface({
          "input" : file.createReadStream()
        });

        lineReader.on('line', function (line) {
          count += line.split(/\s+/).length;
        });  

        lineReader.on('close', function () {
          context.success("The file " + fileName + " has " + count + " words");          
        });  
      }
    }
  }
}
