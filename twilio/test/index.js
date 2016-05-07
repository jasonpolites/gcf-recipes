var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Twilio Tests', function() {

  it('Sends expected payload to twilio and calls success', function(done) {

    var data = {
      to: 'foobar_to',
      from: 'foobar_from',
      message: 'foobar_message',
      account_sid: 'foobar_sid',
      auth_token: 'foobar_token'
    };

    var expectedPayload = {
      to: data['to'],
      from: data['from'],
      body: data['message']
    };

    // Stub twilio so we can assert it's called as expected
    var twilioObj = {
      'messages': {
        'create': function() {}
      }
    };
    var twilio = sinon.stub().returns(twilioObj);

    var sendStub = sinon.stub(twilioObj.messages, 'create').callsArgWith(
      1, null,
      'foobar_result');

    // Create a mock context object that will also contain our assertions in the callback
    var context = {
      success: function(val) {
        try {
          sinon.assert.calledWith(twilio, 'foobar_sid',
            'foobar_token');
          sinon.assert.calledWith(sendStub, expectedPayload);
          chai.expect(val).to.equal('foobar_result');
          done();
        } catch (e) {
          done(e);
        }
      },
      failure: function(err) {
        done(err);
      }
    };

    // We need the module to load our mocked versions
    // Use proxyquire to shim in the stubs
    var stubs = {
      'twilio': twilio
    };

    // Require the module under test and stub out twilio
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.sendSms(context, data);
  });

  it('Fails to send and calls failure', function(done) {

    var data = {
      to: 'foobar_to',
      from: 'foobar_from',
      message: 'foobar_message',
      account_sid: 'foobar_sid',
      auth_token: 'foobar_token'
    };

    // Stub twilio so we can assert it's called as expected
    var twilioObj = {
      'messages': {
        'create': function() {}
      }
    };

    var twilio = sinon.stub().returns(twilioObj);

    var sendStub = sinon.stub(twilioObj.messages, 'create').callsArgWith(
      1,
      'foobar_error', null);

    // Create a mock context object that will also contain our assertions in the callback
    var context = {
      success: function(val) {
        done('Unexpected call to success()');
      },
      failure: function(err) {
        try {
          chai.expect(err).to.equal('foobar_error');
          done();
        } catch (e) {
          done(e);
        }
      }
    };

    // We need the module to load our mocked versions
    // Use proxyquire to shim in the stubs
    var stubs = {
      'twilio': twilio
    };

    // Require the module under test and stub out twilio
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.sendSms(context, data);
  });
});