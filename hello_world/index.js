var self = {
  helloWorld: function(req, res) {
    res.send('Hello World!');
  },
  getVersion: function(req, res) {
   res.send('Version: ' + process.version);
  }
}

module.exports = self;
