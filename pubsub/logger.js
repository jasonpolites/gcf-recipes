var self = {
  'log': function() {
    if (process.env.NODE_ENV !== 'test') {
      console.log.apply(this, arguments);
    }
  },
  'error': function() {
    if (process.env.NODE_ENV !== 'test') {
      console.error.apply(this, arguments);
    }
  }
}
module.exports = self;