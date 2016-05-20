/**
 * Pre-install script.
 * Runs before npm install to make sure that the "setup" module has npm install 
 * run on it.  This means a fresh repo can just run npm install from root, then 
 * run setup.
 */

var fs = require('fs');
var join = require('path').join;
var cp = require('child_process');

var setupPath = join(__dirname, 'setup');

if (fs.existsSync(join(setupPath, 'package.json'))) {
  cp.spawn('npm', ['i'], {
    env: process.env,
    cwd: setupPath,
    stdio: 'inherit'
  });
}