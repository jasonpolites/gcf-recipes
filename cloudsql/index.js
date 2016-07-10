var mysql = require('mysql');
var fs = require('fs');

module.exports = {
  cloudsql: function(req, res) {
    var connection = mysql.createConnection({
      socketPath: '/cloudsql/gcf-test'
    });
    connection.connect();
    connection.end();
  },

  local: function() {
    var connection = mysql.createConnection({
      host: '104.155.152.109',
      user: 'root',
      password: 'happy',
      database: 'gcf-test',
      ssl: {
        cert: fs.readFileSync(__dirname + '/client-key.pem')
      }
    });

    connection.connect();
    connection.end();
  }
}

module.exports.local();