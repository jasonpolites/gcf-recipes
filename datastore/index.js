var gcloud = require('gcloud');

// Keep a reference to the datastore client
// This is OK because the function is stateless
var datastore = null;

var set = function(context, data) {

  // The value contains a JSON document representing the entity we want to save
  var value = data['value'];

  if (!value) {
    context.failure(
      'Value not provided. Make sure you have a \'value\' property ' +
      'in your request');
    return;
  }

  _getKeyFromData(data, function(err, k) {
    if (err) {
      console.error(err);
      context.failure(err);
      return;
    }

    _saveEntity(k, value, function(err) {
      if (err) {
        console.error(err);
        context.failure(err);
      } else {
        context.success('Entity saved');
      }
    });
  });
};

var get = function(context, data) {

  _getEntity(data, function(err, dsKey, entity) {
    if (err) {
      console.error(err);
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
};

var del = function(context, data) {
  _getKeyFromData(data, function(err, k) {
    if (err) {
      console.error(err);
      context.failure(err);
      return;
    }

    var ds = _getDSClient();
    ds.delete(k, function(err, apiResp) {
      if (err) {
        console.error(err);
        context.failure(err);
      } else {
        context.success('Entity deleted');
      }
    });
  });
};

// Gets a Datastore key from the kind/key pair in the request
var _getKeyFromData = function(data, callback) {

  var key = data['key'];
  var kind = data['kind'];

  if (!key) {
    callback('Key not provided. Make sure you have a \'key\' property in ' +
      'your request');
    return;
  }

  if (!kind) {
    callback('Kind not provided. Make sure you have a \'kind\' property in ' +
      'your request');
    return;
  }

  var ds = _getDSClient();

  callback(null, ds.key([kind, key]));
};

// Gets a Datastore entity based on the key information in the request and
// returns null if the entity does not exist
var _getEntity = function(data, callback) {

  _getKeyFromData(data, function(err, k) {
    if (err) {
      callback(err);
      return;
    }

    var ds = _getDSClient();
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
};

// Gets or creates a Datastore client
var _getDSClient = function() {
  if (datastore === null) {
    datastore = gcloud.datastore({
      // We're using the API from the same project as the Cloud Function
      projectId: process.env.GCP_PROJECT,
    });
  }
  return datastore;
};

// Saves (creates or inserts) an entity with the given key
var _saveEntity = function(dsKey, value, callback) {
  var ds = _getDSClient();
  ds.save({
    key: dsKey,
    data: value
  }, callback);
};

module.exports = {
  /**
   * Creates and/or updates a record
   */
  set: set,

  /**
   * Retrieves a record
   */
  get: get,

  /**
   * Deletes a record
   */
  del: del
};