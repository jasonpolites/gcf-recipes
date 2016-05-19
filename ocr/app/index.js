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

      text = text[0];

      logger.log('Extracted text from image (' + text.length +
        ' chars)');

      var
        translate = config['translate'],
        strTopicName;

      if (translate === true) {

        // Use the translate API to detect the language
        var translate = gcloud.translate({
          key: config['translate_key']
        });

        // Detect the language to avoid unnecessary translations
        translate.detect(text, function(err, results) {

          if (err) {
            callback(err);
            return;
          }

          // Build a simple array that we can index
          var matched = [];
          for (var i = 0; i < results.length; ++i) {
            matched.push(results[i].language);
          }

          // Submit a message to the bus for each language we're going to translate to
          var langs = config['to_lang'];

          // Create an array of Promises so we can easily synchronize callbacks
          var promises = [];

          for (var i = 0; i < langs.length; ++i) {
            var lang = langs[i];
            if (matched.indexOf(lang) >= 0) {
              // No need to translate
              strTopicName = config['result_topic'];
            } else {
              strTopicName = config['translate_topic'];
            }

            promises.push(self._publishResult(strTopicName, {
              'text': text,
              'filename': filename,
              'lang': lang
            }));
          }

          Promise.all(promises).then(
            function(result) {
              callback();
            },
            function(err) {
              callback(err);
            });
        });
      } else {
        self._publishResult(config['result_topic'], {
          'text': text,
          'filename': filename
        }).then(callback).catch(callback);
      }
    });
  },

  /**
   * Translates text to English using the Google Translate API
   */
  translate: function(context, data) {

    var text = data['text'];
    var filename = data['filename'];
    var lang = data['lang'];

    if (!text) {
      context.failure('No text found in message');
      logger.error(data);
      return;
    }

    if (!filename) {
      context.failure('No filename found in message');
      return;
    }

    if (!lang) {
      context.failure('No lang found in message');
      return;
    }

    var translate = gcloud.translate({
      key: config['translate_key']
    });

    logger.log('Translating text into ' + lang);

    translate.translate(text, lang, function(err, translation) {
      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      var
        strTopicName = config['result_topic'],
        data = {
          'text': translation,
          'filename': filename,
          'lang': lang
        };

      self._publishResult(strTopicName, data).then(function(err) {
        context.success('Text translated');
      }).catch(function(err) {
        logger.error(err);
        context.failure(err.message);
      });
    });
  },

  /**
   * Saves the data packet to a file in GCS
   */
  saveToGCS: function(context, data) {
    var text = data['text'];
    var filename = data['filename'];
    var lang = data['lang'] || 'unknown';

    logger.log('Received request to save file ' + filename);

    if (!text) {
      context.failure('No text found in message');
      logger.error(data);
      return;
    }

    if (!filename) {
      context.failure('No filename found in message');
      logger.error(data);
      return;
    }

    filename = self._renameImageForSave(filename, lang);

    var bucketName = config['result_bucket'];
    var gcs = gcloud.storage();
    var file = gcs.bucket(bucketName).file(filename);

    logger.log('Saving result to ' + filename + ' in bucket ' + bucketName);

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
  _renameImageForSave: function(filename, lang) {
    var dotIndex = filename.indexOf('.');
    var suffix = '_to_' + lang + '.txt';
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
   * Publishes the result to the given pubsub topic and returns a Promise
   */
  _publishResult: function(strTopicName, data) {
    return new Promise(function(resolve, reject) {
      self._getOrCreateTopic(strTopicName, function(err, topic) {
        if (err) {
          reject(err);
          return;
        }
        // Pub/Sub messages must be valid JSON objects with a data property.
        topic.publish({
          data: data,
        }, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  }
};

module.exports = self;