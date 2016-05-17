var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('OCR Tests', function() {

  var
    sandbox,
    mut,
    context,
    contextMock,
    mutMock,
    gcloud,
    gcloudObj,
    config,
    configObj,
    vision,
    translate,
    storage,
    bucket,
    pubsub,
    file;

  // gcloud = require('gcloud');

  sandbox = sinon.sandbox.create();

  context = {
    success: function(val) {},
    failure: function(val) {},
    done: function() {}
  };

  // Dummy config
  configObj = {
    result_topic: 'foobar_result_topic',
    translate_topic: 'foobar_translate_topic',
    result_bucket: 'foobar_result_bucket',
    translate_key: 'foobar_translate_key',
    translate: false,
    to_lang: 'foobar_to_lang'
  };
  config = function() {
    return configObj;
  };

  gcloudObj = {
    'storage': function() {},
    'vision': function() {},
    'pubsub': function() {},
    'translate': function() {}
  }

  storage = {
    'bucket': function() {}
  };
  bucket = {
    'file': function() {}
  };
  file = {
    'name': 'foobar_file'
  };
  vision = {
    'detectText': function() {}
  };
  translate = {
    'detect': function() {}
  };
  pubsub = {};

  beforeEach(function() {
    contextMock = sandbox.mock(context);
    gcloud = sandbox.stub().returns(gcloudObj);

    sandbox.stub(gcloudObj, 'storage').returns(storage);
    sandbox.stub(gcloudObj, 'vision').returns(vision);
    sandbox.stub(gcloudObj, 'pubsub').returns(pubsub);
    sandbox.stub(gcloudObj, 'translate').returns(translate);

    sandbox.stub(storage, 'bucket').returns(bucket);
    sandbox.stub(bucket, 'file').returns(file);

    var stubs = {
      'gcloud': gcloud,
      './config.js': config
    };

    // Require the module under test and stub out dependencies
    mut = proxyquire('../index.js', stubs);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('Testing ocrGCS', function() {
    it('Returns immediately for delete events', function() {
      // We expect that the function returns immediately if the notification 
      // corresponds to a deleted file.
      var data = {
        'timeDeleted': new Date()
      };

      var ocrStub = sandbox.stub(mut, '_ocr').throws(
        new Error('Unexpected call to _ocr'));

      contextMock.expects('done').once();

      mut.ocrGCS(context, data);

      contextMock.verify();
    });

    it('Calls _ocr with correct data arguments', function() {
      var data = {
        'bucket': 'foobar_bucket',
        'name': 'foobar_name'
      };

      var mutMock = sandbox.mock(mut);

      mutMock.expects('_ocr').once().withArgs({
        'image': file,
        'filename': 'foobar_name'
      }).callsArg(1);

      contextMock.expects('done').once().withExactArgs(undefined);

      mut.ocrGCS(context, data);

      contextMock.verify();
      mutMock.verify();
    });
  });

  describe('Testing ocrHTTP', function() {
    it('Calls _ocr with correct data arguments', function() {
      var data = {
        'filename': 'foobar_name',
        'image': 'foobar_image'
      };

      var mutMock = sandbox.mock(mut);

      mutMock.expects('_ocr').once().withArgs(data).callsArg(1);

      contextMock.expects('done').once().withExactArgs(undefined);

      mut.ocrHTTP(context, data);

      contextMock.verify();
      mutMock.verify();
    });
  });

  describe('Testing _ocr', function() {

    it('Call fails without an image', function() {

      var callback = sinon.mock();

      callback.once().withArgs(
        'Image reference not provided. Make sure you have a \'image\' property in ' +
        'your request expressed as a URL or a cloud storage location'
      );

      mut._ocr({}, callback);

      callback.verify();
    });

    it(
      'Calls the vision API and publishes results but does not call translate if config for translate is false',
      function() {

        var
          image = 'foobar_image',
          text = 'foobar text',
          filename = 'foobar_file'

        var data = {
          image: image
        };

        var expectedData = {
          filename: filename,
          text: text
        }

        var mutMock = sandbox.mock(mut);
        var visionMock = sandbox.mock(vision);
        var translateMock = sandbox.mock(translate);
        var callback = sinon.stub();

        // Mock out the _getFileName method, we'll test that elsewhere
        mutMock.expects('_getFileName').withExactArgs(image)
          .returns(filename);

        // Mock out the _publishResult method, we'll test that elsewhere
        mutMock.expects('_publishResult').withExactArgs(
          'foobar_result_topic', expectedData, callback);

        visionMock.expects('detectText').withArgs(image)
          .callsArgWith(
            1, null, text);

        translateMock.expects('detect').never();

        mut._ocr(data, callback);

        visionMock.verify();
        mutMock.verify();
        translateMock.verify();
      });

    it(
      'Calls the vision API AND the translate API and publishes results to the translate topic for non English detection',
      function() {

        // Ensure config has translate set to true
        configObj.translate = true;

        var
          image = 'foobar_image',
          text = 'foobar text',
          filename = 'foobar_file',
          results = [{
            language: 'es'
          }]

        var data = {
          image: image
        };

        var expectedData = {
          filename: filename,
          text: text
        }

        var mutMock = sandbox.mock(mut);
        var visionMock = sandbox.mock(vision);
        var translateMock = sandbox.mock(translate);
        var callback = sinon.stub();

        // Mock out the _getFileName method, we'll test that elsewhere
        mutMock.expects('_getFileName').withExactArgs(image)
          .returns(filename);

        visionMock.expects('detectText').withArgs(image)
          .callsArgWith(
            1, null, text);

        translateMock.expects('detect').withArgs(text).callsArgWith(
          1, null, results)

        // Mock out the _publishResult method, we'll test that elsewhere
        mutMock.expects('_publishResult').withExactArgs(
          'foobar_translate_topic', expectedData, callback);

        mut._ocr(data, callback);

        translateMock.verify();
        visionMock.verify();
        mutMock.verify();
      });

    it(
      'Calls the vision API AND the translate API and publishes results to the result topic for English detection',
      function() {

        // Ensure config has translate set to true
        configObj.translate = true;

        var
          image = 'foobar_image',
          text = 'foobar text',
          filename = 'foobar_file',
          results = [{
            language: 'es'
          }, {
            language: 'en'
          }]

        var data = {
          image: image
        };

        var expectedData = {
          filename: filename,
          text: text
        }

        var mutMock = sandbox.mock(mut);
        var visionMock = sandbox.mock(vision);
        var translateMock = sandbox.mock(translate);
        var callback = sinon.stub();

        // Mock out the _getFileName method, we'll test that elsewhere
        mutMock.expects('_getFileName').withExactArgs(image)
          .returns(filename);

        visionMock.expects('detectText').withArgs(image)
          .callsArgWith(
            1, null, text);

        translateMock.expects('detect').withArgs(text).callsArgWith(
          1, null, results)

        // Mock out the _publishResult method, we'll test that elsewhere
        mutMock.expects('_publishResult').withExactArgs(
          'foobar_result_topic', expectedData, callback);

        mut._ocr(data, callback);

        translateMock.verify();
        visionMock.verify();
        mutMock.verify();
      });
  });
});