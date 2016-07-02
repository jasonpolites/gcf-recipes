var fs = require('fs');
var EOL = require('os').EOL;

module.exports = {

  readLogLines: function(filePath, num, output) {

    try {

      var buf = fs.readFileSync(filePath);
      var chr = null;
      var marker = buf.length - 1;
      var count = 0;

      for (var i = marker; i >= 0; --i) {
        chr = buf.toString('utf8', i - 1, i);
        if (chr === EOL) {
          // We hit a newline char
          if (marker !== i) {
            // Mark this position
            marker = i;
            if (++count >= num) {
              break;
            }
          }
        }
      }

      if (count > 0) {
        output(buf.toString('utf8', marker, buf.length));
      }

    } catch (e) {
      if (e.code === 'ENOENT') {
        output('');
        return;
      }

      throw e;
    }
  }
}