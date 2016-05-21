var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Datastore Tests', function() {

  var
    sandbox,
    mut,
    context,
    contextMock,
    mutMock,
    gcloud,
    gcloudObj,
    datastore,
    datastoreStub;

  sandbox = sinon.sandbox.create();

  context = {
    success: function(val) {},
    failure: function(val) {},
  };

  gcloudObj = {
    datastore: function() {},
  }

  datastore = {
    get: function() {},
    save: function() {},
    key: function() {},
    delete: function() {},
  };

  beforeEach(function() {
    contextMock = sandbox.mock(context);
    gcloud = sandbox.stub().returns(gcloudObj);
    datastoreStub = sandbox.stub(gcloudObj, 'datastore').returns(
      datastore);

    var stubs = {
      'gcloud': gcloud
    };

    // Require the module under test and stub out dependencies
    mut = proxyquire('../index.js', stubs);
  });

  afterEach(function() {
    sandbox.restore();
  });


  it('Set fails without a value', function() {

    contextMock.expects('failure').once().withArgs(
      'Value not provided. Make sure you have a \'value\' property in your request'
    );

    var data = {};

    mut.set(context, data);

    contextMock.verify();
  });

  it('Set fails without a kind', function() {

    contextMock.expects('failure').once().withArgs(
      'Kind not provided. Make sure you have a \'kind\' property in your request'
    );

    var data = {
      'value': 'foobar_value',
      'key': 'foobar_key'
    };

    mut.set(context, data);

    contextMock.verify();
  });

  it('Set fails without a key', function() {

    contextMock.expects('failure').once().withArgs(
      'Key not provided. Make sure you have a \'key\' property in your request'
    );

    var data = {
      'value': 'foobar_value',
      'kind': 'foobar_kind'
    };

    mut.set(context, data);

    contextMock.verify();
  });

  it('Calling set correctly saves the object', function() {

    var dsKey = 'foobar_ds_key';
    var dsValue = 'foobar_value';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key',
      'value': dsValue
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("save").once().withArgs({
      key: dsKey,
      data: dsValue
    }).callsArg(1);

    contextMock.expects('success').once().withArgs('Entity saved');

    mut.set(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });

  it('Set fails if datastore save fails', function() {

    var dsKey = 'foobar_ds_key';
    var dsValue = 'foobar_value';
    var err = 'foobar_error';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key',
      'value': dsValue
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("save").once().callsArgWith(1, err);

    contextMock.expects('failure').once().withArgs(err);

    mut.set(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });

  it('Calling get correctly retrieves the object', function() {

    // Setup some dummy values
    var dsKey = 'foobar_ds_key';
    var dsEntity = 'foobar_entity';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("get").once().withArgs(dsKey).callsArgWith(1,
      null, dsEntity);

    contextMock.expects('success').once().withArgs(dsEntity);

    mut.get(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });

  it('Get fails if datastore get returns null', function() {

    var dsKey = {
      path: 'foobar_key_path'
    };

    var dsEntity = 'foobar_entity';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("get").once().withArgs(dsKey).callsArgWith(1,
      null, null);

    contextMock.expects('failure').once().withArgs(
      'No entity found for key foobar_key_path');

    mut.get(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });

  it('Get fails if datastore get fails', function() {

    var err = 'foobar_error';

    var dsKey = {
      path: 'foobar_key_path'
    };

    var dsEntity = 'foobar_entity';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("get").once().withArgs(dsKey).callsArgWith(1, err);

    contextMock.expects('failure').once().withArgs(err);

    mut.get(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });


  it('Calling del correctly deletes the object', function() {

    var dsKey = 'foobar_ds_key';
    var dsApiResponse = 'foobar_api_response'

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("delete").once().withArgs(dsKey).callsArgWith(
      1, null, dsApiResponse);

    contextMock.expects('success').once().withArgs('Entity deleted');

    mut.del(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });

  it('Del fails if datastore delete fails', function() {

    var dsKey = 'foobar_ds_key';
    var dsApiResponse = 'foobar_api_response';
    var err = 'foobar_error';

    var data = {
      'kind': 'foobar_kind',
      'key': 'foobar_key'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").once().withArgs(['foobar_kind',
      'foobar_key'
    ]).returns(dsKey);

    mockDatastore.expects("delete").once().callsArgWith(
      1, err);

    contextMock.expects('failure').once().withArgs(err);

    mut.del(context, data);

    contextMock.verify();
    mockDatastore.verify();
  });


  it('Set fails when no key is provided', function() {
    _testNullKeyForMethod("save", mut.set);
  });

  it('Set fails when no kind is provided', function() {
    _testNullKindForMethod("save", mut.set);
  });

  it('Get fails when no key is provided', function() {
    _testNullKeyForMethod("get", mut.get);
  });

  it('Get fails when no kind is provided', function() {
    _testNullKindForMethod("get", mut.get);
  });

  it('Del fails when no key is provided', function() {
    _testNullKeyForMethod("delete", mut.del);
  });

  it('Del fails when no kind is provided', function() {
    _testNullKindForMethod("delete", mut.del);
  });

  // Common test impl reused in various module method tests
  var _testNullKindForMethod = function(strExpectedMethod, funcModuleFunction) {

    var data = {
      'key': 'foobar_key',
      'value': 'foobar_value'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").never();
    mockDatastore.expects(strExpectedMethod).never();

    contextMock.expects('failure').once().withArgs(
      'Kind not provided. Make sure you have a \'kind\' property in your request'
    );

    // Call the module under test
    funcModuleFunction.call(this, context, data);

    contextMock.verify();
    mockDatastore.verify();
  }

  var _testNullKeyForMethod = function(strExpectedMethod, funcModuleFunction) {

    var data = {
      'kind': 'foobar_kind',
      'value': 'foobar_value'
    };

    var mockDatastore = sandbox.mock(datastore);

    mockDatastore.expects("key").never();
    mockDatastore.expects(strExpectedMethod).never();

    contextMock.expects('failure').once().withArgs(
      'Key not provided. Make sure you have a \'key\' property in your request'
    );

    // Call the module under test
    funcModuleFunction.call(this, context, data);

    contextMock.verify();
    mockDatastore.verify();
  }
});