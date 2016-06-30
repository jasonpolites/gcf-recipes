var gcloud = require('gcloud')({
  // We're using the API from the same project as the Cloud Function.
  projectId: process.env.GCP_PROJECT
});

// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

// Keep a reference to the datastore client
// This is OK because the function is stateless
var datastore = null;

var self = {

  set: function(req, res) {
    self._httpBinder(req, res, self._set);
  },

  get: function(req, res) {
    self._httpBinder(req, res, self._get);
  },

  del: function(req, res) {
    self._httpBinder(req, res, self._del);
  },

  /**
   * Simple binder function to cater for new HTTP function signatures.
   **/
  _httpBinder: function(req, res, fn) {

    fn.call(fn, {
      success: function(val) {
        res.json(val);
      },
      failure: function(val) {
        if (val.message) {
          res.status(500).send(val.message);
          return;
        }
        res.status(500).json(val);
      }
    }, req.body);
  },

  /**
   * Creates and/or updates a record
   */
  _set: function(context, data) {

    // The value contains a JSON document representing the entity we want to save
    var value = data['value'];

    if (!value) {
      context.failure(
        'Value not provided. Make sure you have a \'value\' property ' +
        'in your request');
      return;
    }

    self._getKeyFromData(data, function(err, k) {
      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      self._saveEntity(k, value, function(err) {
        if (err) {
          logger.error(err);
          context.failure(err);
        } else {
          context.success('Entity saved');
        }
      });
    });
  },

  /**
   * Retrieves a record
   */
  _get: function(context, data) {

    self._getEntity(data, function(err, dsKey, entity) {

      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      // The get operation will not fail for a non-existent entity, it just returns null.
      if (!entity) {
        context.failure('No entity found for key ' + dsKey['path']);
      } else {
        context.success(entity);
      }
    });
  },

  /**
   * Deletes a record
   */
  _del: function(context, data) {
    self._getKeyFromData(data, function(err, k) {
      if (err) {
        logger.error(err);
        context.failure(err);
        return;
      }

      var ds = self._getDSClient();

      ds.delete(k, function(err, apiResp) {
        if (err) {
          logger.error(err);
          context.failure(err);
        } else {
          context.success('Entity deleted');
        }
      });
    });
  },

  // Gets a Datastore key from the kind/key pair in the request
  _getKeyFromData: function(data, callback) {

    var key = data['key'];
    var kind = data['kind'];

    if (!key) {
      callback(
        'Key not provided. Make sure you have a \'key\' property in ' +
        'your request');
      return;
    }

    if (!kind) {
      callback(
        'Kind not provided. Make sure you have a \'kind\' property in ' +
        'your request');
      return;
    }

    var ds = self._getDSClient();

    callback(null, ds.key([kind, key]));
  },

  // Gets a Datastore entity based on the key information in the request and
  // returns null if the entity does not exist
  _getEntity: function(data, callback) {

    self._getKeyFromData(data, function(err, k) {
      if (err) {
        callback(err);
        return;
      }

      var ds = self._getDSClient();

      ds.get(k, function(err, entity) {
        if (entity) {
          callback(null, k, entity);
        } else if (err) {
          callback(err);
        } else {
          callback(null, k);
        }
      });
    });
  },

  // Gets or creates a Datastore client
  _getDSClient: function() {
    if (datastore === null) {
      datastore = gcloud.datastore();
    }
    return datastore;
  },

  // Saves (creates or inserts) an entity with the given key
  _saveEntity: function(dsKey, value, callback) {
    var ds = self._getDSClient();
    ds.save({
      key: dsKey,
      data: value
    }, callback);
  }
};

module.exports = self;