var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();

describe('Sendgrid Tests', function() {

  it('Sends expected payload to sendgrid and calls success', function(done) {

    var data = {
      to: 'foobar_to',
      from: 'foobar_from',
      subject: 'foobar_subject',
      body: 'foobar_body',
      sg_key: 'foobar_key'
    };

    var expectedPayload = {
      to: data['to'],
      from: data['from'],
      subject: data['subject'],
      text: data['body']
    };

    // Stub sendgrid so we can assert it's called as expected
    var sendgridObj = {
      'send': function() {}
    };
    var sendgrid = sinon.stub().returns(sendgridObj);

    var sendStub = sinon.stub(sendgridObj, 'send').callsArgWith(1, null,
      'foobar_result');

    // Create a mock context object that will also contain our assertions in the callback
    var context = {
      success: function(val) {
        try {
          sinon.assert.calledWith(sendgrid, 'foobar_key');
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
      'sendgrid': sendgrid
    };

    // Require the module under test and stub out sendgrid
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.sendEmail(context, data);
  });

  it('Fails to send and calls failure', function(done) {

    var data = {
      to: 'foobar_to',
      from: 'foobar_from',
      subject: 'foobar_subject',
      body: 'foobar_body',
      sg_key: 'foobar_key'
    };

    // Stub sendgrid so we can assert it's called as expected
    var sendgridObj = {
      'send': function() {}
    };
    var sendgrid = sinon.stub().returns(sendgridObj);

    var sendStub = sinon.stub(sendgridObj, 'send').callsArgWith(1,
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
      'sendgrid': sendgrid
    };

    // Require the module under test and stub out sendgrid
    var mut = proxyquire('../index.js', stubs);

    // Now call the module under test.  Assertions will happen in the callback, 
    // and the test will timeout if the callback is not called.
    mut.sendEmail(context, data);
  });
});