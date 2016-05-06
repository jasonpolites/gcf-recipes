var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Datastore Tests', function() {

  var mut = require('../index.js');

  var context = {
    success: function(val) {},
    failure: function(val) {}
  };

  var mockContext;

  beforeEach(function() {
    mockContext = sinon.mock(context);  
  });

  afterEach(function() {
    mockContext.restore();
  });

  it('Set fails without a value', function () {

    mockContext.expects('failure').once().withArgs('Value not provided. Make sure you have a \'value\' property in your request');

    var data = {};

    mut.set(context, data);

    mockContext.verify();
  });

  it('Set fails without a kind', function () {

    mockContext.expects('failure').once().withArgs('Kind not provided. Make sure you have a \'kind\' property in your request');

    var data = {
      'value' : 'foobar_value',
      'key' : 'foobar_key'
    };

    mut.set(context, data);

    mockContext.verify();
  });

  it('Set fails without a key', function () {

    mockContext.expects('failure').once().withArgs('Key not provided. Make sure you have a \'key\' property in your request');

    var data = {
      'value' : 'foobar_value',
      'kind' : 'foobar_kind'
    };

    mut.set(context, data);

    mockContext.verify();
  }); 

  it('Calling set correctly saves the object', function () {

    // Setup some dummy values that we expect to be "written" to datastore
    var dsKey = 'foobar_ds_key';
    var dsValue = 'foobar_value';

    var data = {
      'kind' : 'foobar_kind',
      'key' : 'foobar_key',
      'value': dsValue
    };

    // Mock out gcloud so we can return a stub of the datastore client
    var gcloud = require('gcloud');

    // Create a dummy datastore client
    var datastore = {
      'key': function() {},
      'save': function(obj, callback) {}
    };

    // Stub out the real 'datastore' function to return our dummy
    sinon.stub(gcloud, 'datastore').returns(datastore);

    // Setup the exectations on the dummy client
    var mockDatastore = sinon.mock(datastore);

    // Make sure the key is created with the right values
    mockDatastore.expects("key").once().withArgs(['foobar_kind', 'foobar_key']).returns(dsKey);

    // Make sure the save occurs
    // Make sure our mock still calls the callback (this is what datastore would do)
    mockDatastore.expects("save").once().withArgs({
      key: dsKey,
      data: dsValue
    }).callsArg(1); 

    // We also expect the result to be successful
    mockContext.expects('success').once().withArgs('Entity saved');

    var stubs = {
      'gcloud': gcloud, 
    };

    // Require the module under test and stub out gcloud
    var mut = proxyquire('../index.js', stubs);

    // Call the module under test
    mut.set(context, data);

    // Verify that the methods we expected to be called were in-fact called
    mockContext.verify();
    mockDatastore.verify();
    
    // Restore the stub for the next test
    gcloud.datastore.restore();
  }); 

  it('Calling get correctly retrieves the object', function () {

    // Setup some dummy values
    var dsKey = 'foobar_ds_key';
    var dsEntity = 'foobar_entity';

    var data = {
      'kind' : 'foobar_kind',
      'key' : 'foobar_key'
    };

    // Mock out gcloud so we can return a stub of the datastore client
    var gcloud = require('gcloud');

    // Create a dummy datastore client
    var datastore = {
      'key': function() {},
      'get': function(key, callback) {}
    };

    // Stub out the real 'datastore' function to return our dummy
    sinon.stub(gcloud, 'datastore').returns(datastore);

    // Setup the exectations on the dummy client
    var mockDatastore = sinon.mock(datastore);

    // Make sure the key is created with the right values
    mockDatastore.expects("key").once().withArgs(['foobar_kind', 'foobar_key']).returns(dsKey);

    // Make sure the get occurs
    // Make sure our mock still calls the callback (this is what datastore would do)
    mockDatastore.expects("get").once().withArgs(dsKey).callsArgWith(1, null, dsEntity); 

    // We also expect the result to be successful
    mockContext.expects('success').once().withArgs(dsEntity);

    var stubs = {
      'gcloud': gcloud, 
    };

    // Require the module under test and stub out gcloud
    var mut = proxyquire('../index.js', stubs);

    // Call the module under test
    mut.get(context, data);

    // Verify that the methods we expected to be called were in-fact called
    mockContext.verify();
    mockDatastore.verify();

    // Restore the stub for the next test
    gcloud.datastore.restore();
  }); 

  it('Calling del correctly deletes the object', function () {

    // Setup some dummy values
    var dsKey = 'foobar_ds_key';
    var dsApiResponse = 'foobar_api_response'

    var data = {
      'kind' : 'foobar_kind',
      'key' : 'foobar_key'
    };

    // Mock out gcloud so we can return a stub of the datastore client
    var gcloud = require('gcloud');

    // Create a dummy datastore client
    var datastore = {
      'key': function() {},
      'delete': function(key, callback) {}
    };

    // Stub out the real 'datastore' function to return our dummy
    sinon.stub(gcloud, 'datastore').returns(datastore);

    // Setup the exectations on the dummy client
    var mockDatastore = sinon.mock(datastore);

    // Make sure the key is created with the right values
    mockDatastore.expects("key").once().withArgs(['foobar_kind', 'foobar_key']).returns(dsKey);

    // Make sure the get occurs
    // Make sure our mock still calls the callback (this is what datastore would do)
    mockDatastore.expects("delete").once().withArgs(dsKey).callsArgWith(1, null, dsApiResponse); 

    // We also expect the result to be successful
    mockContext.expects('success').once().withArgs('Entity deleted');

    var stubs = {
      'gcloud': gcloud, 
    };

    // Require the module under test and stub out gcloud
    var mut = proxyquire('../index.js', stubs);

    // Call the module under test
    mut.del(context, data);

    // Verify that the methods we expected to be called were in-fact called
    mockContext.verify();
    mockDatastore.verify();

    // Restore the stub for the next test
    gcloud.datastore.restore();
  });      


});