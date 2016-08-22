var Assistant = require('assistantsdk');

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
    res.send('Hello World!');
  },

  getVersion: function(req, res) {
    res.send('Version: ' + process.version);
  },

  printHeaders: function(req, res) {
    res.send(req.headers);
  },

  printRequest: function(req, res) {

    var obj = {
      'baseUrl': req.baseUrl,
      'hostname': req.hostname,
      'ip': req.ip,
      'ips': req.ips,
      'originalUrl': req.originalUrl,
      'url': req.url,
      'subdomains': req.subdomains
    };

    res.send(obj);
  },

  simplePOST: function(req, res) {
    var assistant = new Assistant(req, res);
    var top_action = assistant.getTopAction();
    // var json = req.body;
    // console.log(req.body.intend);
    res.send(top_action);
  }
}

module.exports = self;