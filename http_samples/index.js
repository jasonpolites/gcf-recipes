var self = {
  httpRedirectTest: function(req, res) {
    if (req.method === 'GET') {
      res.redirect('http://www.google.com');
    } else {
      res.status(405).send('Only GET is supported');
    }
  },

  httpCORSTest: function(req, res) {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, PUT, POST');
    if (req.method === 'OPTIONS') {
      res.end();
    } else {
      res.send('Hello ' + req.body + '!');
    }
  },

  index: function(req, res) {
    var fileSystem = require('fs');
    var readStream = fileSystem.createReadStream('./index.html');
    readStream.pipe(res);
  },

  helloWorld: function(req, res) {
    res.send('Hello World!')
  }
}

module.exports = self;