var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var dir = path.resolve(__dirname, '.');

var npmInstall = function(dir) {
	fs.readdirSync(dir).filter(function(file) {
		return fs.statSync(path.join(dir, file)).isDirectory();
	}).forEach(function(mod) {
		if (mod !== 'node_modules' && mod !== 'coverage' && mod !== '.git') {
			var modPath = path.join(dir, mod);
			if (fs.existsSync(path.join(modPath, 'package.json'))) {
				cp.spawn('npm', ['i'], {
					env: process.env,
					cwd: modPath,
					stdio: 'inherit'
				});
			}
			// recurse
			npmInstall(modPath);
		}
	});
};

npmInstall(dir);