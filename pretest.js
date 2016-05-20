/**
 * Pre-test script.
 * Runs before npm test to make sure all modules in subdirectories have 
 * npm install run on them first.  This ensures there are no dependency 
 * issues when running tests from root.
 */

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var dir = path.resolve(__dirname, '.');

// Recursively runs npm install on all folders and subfolders
// the contain a package.json
var npmInstall = function(dir) {
	if (fs.existsSync(path.join(dir, 'package.json'))) {
		runNpmInstall(dir);
	}

	fs.readdirSync(dir).filter(function(file) {
		return fs.statSync(path.join(dir, file)).isDirectory();
	}).forEach(function(mod) {
		if (mod !== 'node_modules' && mod !== 'coverage' && mod !== '.git') {
			npmInstall(path.join(dir, mod));
		}
	});
};

var runNpmInstall = function(modPath) {
	cp.spawn('npm', ['i'], {
		env: process.env,
		cwd: modPath,
		stdio: 'inherit'
	});
};

// main
npmInstall(dir);