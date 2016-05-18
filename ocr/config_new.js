/******************************************************************************
 * OCR Recipe Configuration Module
 *****************************************************************************/


var self = {

  _cache: null,

  _config: {
    // The topic that will receive final text results
    result_topic: 'gcf-ocr-result',

    // The topic on which translation requests will be made
    translate_topic: 'gcf-ocr-translate',

    // The name of the gcs bucket to which we will write results
    result_bucket: 'gcf-test-ocr-out'
  },

  _merge: function(obj, src) {
    for (var key in src) {
      if (src.hasOwnProperty(key)) obj[key] = src[key];
    }
    return obj;
  },

  getConfig: function(callback) {
    if (self._cache) {
      callback(self._cache);
      return;
    }

    var gcloud = require('gcloud')({
      projectId: process.env.GCP_PROJECT,
      keyFilename: __dirname + '/keyfile.json'
    });

    var datastore = gcloud.datastore();
    var query = datastore.createQuery('gcf-ocr-test', 'config');

    datastore.runQuery(query, function(err, entities, nextQuery,
      apiResponse) {

      if (err) {
        callback(err);
        return;
      }

      // Assume just 1 entity
      var liveConf = entities[0];

      self._cache = {};
      self._merge(self._cache, self._config);
      self._merge(self._cache, liveConf);

      callback(self._cache);
    });
  }
};

module.exports = self;