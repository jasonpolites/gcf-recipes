var command = LOCAL_COMMAND =
  "./node_modules/.bin/istanbul cover -x '**/logger.js' ./node_modules/.bin/_mocha -- **/test/  **/app/test";
var TRAVIS_COMMAND = LOCAL_COMMAND +
  " && cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js";

if (process.env.TRAVIS === true) {
  command = TRAVIS_COMMAND;
}

process.env.NODE_ENV = "test";

require('child_process').exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(error);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});