var gcloud = require('gcloud');
var datastore = null;

var set = function(context, data) {

  var value = data['value'];

  if (!value) {
    context.failure(
        'Value not provided. Make sure you have a \'value\' property ' +
        'in your request');
    return;
  }

  // Get the current entity (if the entity does not exist, it will return null)
  _getKeyFromData(data, function(k, err) {
    if(err) {
      console.log(err);
      // Signal function failure
      context.failure(err);
      return;
    }

    _saveEntity(k, value, function(err) {
      if(err) {
        console.log(err);
        // Signal function failure
        context.failure(err);
      } else {
        context.success('Entity saved');
      }
    });
  });
}

var get = function(context, data) {
  _getEntity(data, function(dsKey, entity, err) {
    if(err) {
      console.log(err);
      context.failure(err);
    } else {
      if(!entity) {
        context.failure("No entity found for key " + dsKey['path']);
      } else {
        context.success(entity);
      }
    }
  });
}

var del = function(context, data) {
  _getKeyFromData(data, function(k, err) {
    if(err) {
      console.log(err);
      context.failure(err);
    } else {
      var ds = _getDSClient();      
      ds.delete(k, function(err, apiResp) {
        if(err) {
          console.log(err);
          context.failure(err);
        } else {
          context.success('Entity deleted');
        }
      });
    }    
  });
}

var _getKeyFromData = function(data, callback) {

  var key = data['key'];
  var kind = data['kind'];

  if (!key) {
    callback(null,
        'Key not provided. Make sure you have a \'key\' property in ' +
        'your request');
    return;
  }

  if (!kind) {
    callback(null,
        'Kind not provided. Make sure you have a \'kind\' property in ' +
        'your request');
    return;
  }  

  // Get the datastore client
  var ds = _getDSClient();
  callback (ds.key([kind, key]), null);    
}

var _getEntity = function(data, callback) {

  _getKeyFromData(data, function(k, err) {
    if(err) {
      console.log(err);
      callback(null, null, err);
    } else {
      var ds = _getDSClient();      
      ds.get(k, function(err, entity) {
        if(entity) {
          callback(k, entity, null);
        } else if(err) {
          callback(null, null, err);
        } else {
          callback(k, null, null);
        }
      });
    }    
  });
}

var _getDSClient = function() {
  // Get or create the datastore client.
  if(datastore === null) {
    datastore = gcloud.datastore({
      // We're using the API from the same project as the Cloud Function.
      projectId: process.env.GCP_PROJECT,
    });
  }
  return datastore;
}


var _saveEntity = function(dsKey, value, callback) {
  var ds = _getDSClient();
  ds.save({
    key: dsKey,
    data: value
  }, callback);
}

module.exports = {
  /**
   * Creates and/or updates a record
   */
  "set": set,

  /**
   * Retrieves a record
   */
  "get": get,

  /**
   * Deletes a record
   */
  "del": del
};
