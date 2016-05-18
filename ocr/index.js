var gcloud = require('gcloud')({
  // We're using the API from the same project as the Cloud Function.
  projectId: process.env.GCP_PROJECT,
  keyFilename: __dirname + '/keyfile.json'
});

// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

// Import the configuration required for this function.
var config = require('./config.js')(process.env.GCP_PROJECT);

var self = {

  // OCR Function to be bound to a GCS trigger
  ocrGCS: function(context, data) {

    if (data.hasOwnProperty('timeDeleted')) {
      // This is a deletion event, we don't want to process this
      context.done();
      return;
    }

    // Data schema taken from 
    // https://cloud.google.com/storage/docs/json_api/v1/objects#resource
    var storage = gcloud.storage();
    var bucket = storage.bucket(data['bucket']);
    var file = bucket.file(data['name']);
    self._ocr({
      'image': file,
      'filename': data['name']
    }, function(err) {
      context.done(err);
    });
  },

  // OCR Function to be bound to an HTTP trigger
  ocrHTTP: function(context, data) {
    // Expect a URL in the data argument
    self._ocr(data, function(err) {
      context.done(err);
    });
  },

  /**
   * Detects the text in an image using the Google Vision API
   */
  _ocr: function(data, callback) {

    var image = data['image'];
    var filename = data['filename'];

    if (!image) {
      callback(
        'Image reference not provided. Make sure you have a \'image\' property in ' +
        'your request expressed as a URL or a cloud storage location');
      return;
    }

    if (!filename) {
      filename = self._getFileName(image);
    }

    logger.log('Looking for text in file ' + filename);

    var vision = gcloud.vision();

    // Read the text from an image.
    vision.detectText(image, function(err, text) {
      if (err) {
        callback(err);
        return;
      }

      logger.log('Extracted text from image');

      // Check to see if we should translate this.
      var
        translate = config['translate'],
        strTopicName,
        data = {
          'text': text,
          'filename': filename
        };

      if (translate === true) {

        // Use the translate API to detect the language
        var translate = gcloud.translate({
          key: config['translate_key']
        });

        translate.detect(text, function(err, results) {

          console.log('In detect with err ' + err);

          if (err) {
            callback(err);
            return;
          }

          // Translate by default
          strTopicName = config['translate_topic'];

          // If English is in the list, don't bother translating
          for (var i = 0; i < results.length; ++i) {
            if (results[i].language === 'en') {
              strTopicName = config['result_topic'];
              break;
            }
          }
          self._publishResult(strTopicName, data, callback);
        });
      } else {
        self._publishResult(config['result_topic'], data, callback);
      }
    });
  },

  /**
   * Translates text to English using the Google Translate API
   */
  translate: function(context, data) {

    var text = data['text'];
    var filename = data['filename'];

    if (!text) {
      context.failure('No text found in message');
      return;
    }

    if (!filename) {
      context.failure('No filename found in message');
      return;
    }

    var translate = gcloud.translate({
      key: config['translate_key']
    });

    translate.translate(text, config['to_lang'], function(err, translation) {
      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      var
        strTopicName = config['result_topic'],
        data = {
          'text': translation,
          'filename': filename
        };

      self._publishResult(strTopicName, data, function(err) {
        if (err) {
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

    if (!text) {
      context.failure('No text found in message');
      return;
    }

    if (!filename) {
      context.failure('No filename found in message');
      return;
    }

    filename = self._renameImageForSave(filename);

    var gcs = gcloud.storage();
    var bucket = config['result_bucket'];
    var file = gcs.bucket(bucket).file(filename);

    file.save(text, function(err) {
      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }
      context.success('Text written to ' + file.name);
    });
  },

  // Appends a .txt suffix to the image name
  _renameImageForSave: function(filename) {
    var dotIndex = filename.indexOf('.');
    var suffix = '.txt';
    if (dotIndex !== -1) {
      filename = filename.replace(/\.[^/.]+$/, suffix);
    } else {
      filename += suffix;
    }
    return filename;
  },

  // Gets or creates a pubsub topic
  _getOrCreateTopic: function(strTopic, callback) {
    var pubsub = gcloud.pubsub();
    var topic = pubsub.topic(strTopic);
    topic.exists(function(err, exists) {
      if (err) {
        callback(err);
        return;
      }
      if (exists !== true) {
        pubsub.createTopic(strTopic, function(err, topic, apiResponse) {
          callback(err, topic);
        });
      } else {
        callback(null, topic);
      }
    });
  },

  /** 
   * Gets the filename from a URL
   **/
  _getFileName: function(val, defaultValue) {
    var url = require('url').parse(val);
    var paths = url.pathname.split('/');
    var result = paths[paths.length - 1];
    return result || defaultValue;
  },

  /**
   * Publishes the result to the given pubsub topic
   */
  _publishResult: function(strTopicName, data, callback) {
    self._getOrCreateTopic(strTopicName, function(err, topic) {
      if (err) {
        callback(err);
        return;
      }
      // Pub/Sub messages must be valid JSON objects.
      topic.publish({
        data: {
          message: data,
        },
      }, callback);
    });
  }
};

module.exports = self;