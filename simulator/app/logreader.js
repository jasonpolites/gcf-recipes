var fs = require('fs');
var EOL = require('os').EOL;

module.exports = {

  readLogLines: function(filePath, num, output) {

    try {

      var buf = fs.readFileSync(filePath);
      var chr = null;
      var cursor = buf.length;
      var count = 0;

      for (var i = cursor; i >= 0; --i) {
        chr = buf.toString('utf8', i - 1, i);
        if (chr === EOL) {
          // We hit a newline char
          if (cursor !== i) {
            // Mark this position
            cursor = i;
            if (++count >= num) {
              break;
            }
          }
        }
      }

      // The last line in the squence (the first line in the file)
      // will not terminate with EOL, so ensure we're always include 
      // the last line
      if (count < num) {
        cursor = 0;
      }

      output(buf.toString('utf8', cursor, buf.length) + '\n');

    } catch (e) {
      if (e.code === 'ENOENT') {
        output('');
        return;
      }

      throw e;
    }
  }
}