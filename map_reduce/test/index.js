var mapReduce = require('../index.js');
var expect = require('chai').expect;
var sinon = require('sinon');
var req = require('request-promise');

describe('Map Reduce Tests', function() {
  it('counts words in a line correctly', function() {
    var line = 'Shall I compare thee to a summer\'s day?';
    var data = {
      line: line,
    };
    var value;
    var context = {
      success: function(val) {
        value = val;
      },
    };
    mapReduce.map(context, data);
    expect(value).to.equal('8');
  });
});
