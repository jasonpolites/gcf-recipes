var chai = require('chai');
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();
var execSync = require('child_process').exec;

describe('Cloud Functions Emulator Tests', function() {

  before(function() {
    execSync('functions start');
  });

  afterEach(function() {
    execSync('functions clear');
  });

  after(function() {
    console.log('Stopping')
    execSync('functions stop');
  });

  it('Tests?', function() {

  });

});