var gcloud = require('gcloud')({
  // We're using the API from the same project as the Cloud Function.
  projectId: process.env.GCP_PROJECT
});

// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

// Import the configuration required for this function.
var config = require('./config.js')(process.env.GCP_PROJECT);

var self = {

  /**
   * Detects the text in an image using the Google Vision API
   */
  ocr: function(context, data) {

    var image = data['image'];

    if (!image) {
      context.failure(
        'Image reference not provided. Make sure you have a \'image\' property in ' +
        'your request expressed as a URL or a cloud storage location');
      return;
    }

    var filename = self._getFileName(image);

    logger.log('Looking for text in file ' + filename);

    var vision = gcloud.vision();

    // Read the text from an image.
    vision.detectText(image, function(err, text) {
      if(err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      logger.log('Extracted text from image');

      // Check to see if we should translate this.
      var 
        translate = data['translate'],
        strTopicName,
        data = {
          'text': text,
          'filename': filename
        };

      if(translate === true) {

        // Use the translate API to detect the language
        var translate = gcloud.translate({
          key: config['translate_key']
        });           

        translate.getLanguages(function(err, languages) {
          if(err) {
            logger.error(err);
            context.failure(err);
            return;
          }

          // If English is in the list, don't bother translating
          if(languages.indexOf('en') !== -1) {
            strTopicName = config['result_topic'];
          } else {
            strTopicName = config['translate_topic'];
          }
        });        
      } else {
        strTopicName = config['result_topic'];
      }

      _publishResult(strTopicName,data, function(err) {
        if(err) {
          logger.error(err);
          context.failure(err);
          return;
        }
        context.success('Text extracted');
      });
    });    
  },

  /**
   * Translates text to English using the Google Translate API
   */
  translate: function(context, data) {

    var text = data['text'];
    var filename = data['filename'];

    if(!text) {
      context.failure('No text found in message');
      return;
    }

    if(!filename) {
      context.failure('No filename found in message');
      return;
    }    

    var translate = gcloud.translate({
      key: config['translate_key']
    });   

    translate.translate(text, 'en', function(err, translation) {
      if(err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      var 
        strTopicName = config['result_topic'],
        data = {
          'text': text,
          'filename': filename
        };

      _publishResult(strTopicName,data, function(err) {
        if(err) {
          logger.error(err);
          context.failure(err);
          return;
        }
        context.success('Text translated');
      });
    });     
  },

  /**
   * Saves the data packet to a file in GCS
   */
  saveToGCS: function(context, data) {
    var text = data['text'];
    var filename = data['filename'];

    var dotIndex = filename.indexOf('.');

    if(dotIndex !== -1) {
      // Add a file extension
      filename += '.text';
    } else {
      // Change the file extension
      filename = filename.replace(/\.[^/.]+$/, ".text");
    }

    var gcs = gcloud.storage();
    var bucket = config['result_bucket'];
    var file = gcs.bucket(bucket).file(filename);

    file.save(text, function(err) {
      if(err) {
        logger.error(err);
        context.failure(err);
        return;
      }
      console.success('Text written to ' + file.name);
    });
  },

  // Gets or creates a pubsub topic
  _getOrCreateTopic: function(strTopic, callback) {
    var pubsub = gcloud.pubsub();
    pubsub.createTopic(strTopic, function(err, topic, apiResponse) {
      callback(err, topic);
    });
  },

  /** 
   * Gets the filename from a URL
   **/
  _getFileName: function(val) {
    var url = require('url').parse(val);
    var paths = url.pathname.split('/');
    return paths[paths.length-1];
  }

  /**
   * Publishes the result to the given pubsub topic
   */
  _publishResult: function(strTopicName, data, callback) {
    _getOrCreateTopic(strTopicName, function (err, topic) {
      if(err) {
        callback(err);
        return;
      }      
      // Pub/Sub messages must be valid JSON objects.
      topic.publish({
          data: {
            message: data,
          },
        },callback);
    });
  }
};

module.exports = self;