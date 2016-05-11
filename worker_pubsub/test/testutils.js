// Example taken from https://nodejs.org/docs/latest/api/events.html#emitter.on
const EventEmitter = require('events');
const util = require('util');

function DummySubscription() {
	EventEmitter.call(this);
};

util.inherits(DummySubscription, EventEmitter);

var self = {
	'createEmitter': function() {
		return new DummySubscription();
	}
};

module.exports = self;