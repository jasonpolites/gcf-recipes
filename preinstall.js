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