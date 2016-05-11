// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

module.exports = {
  sendEmail: function(context, data) {
    // Using SendGrid's Node.js Library https://github.com/sendgrid/sendgrid-nodejs
    var sendgrid = require('sendgrid')(data['sg_key']);

    var payload = {
      to: data['to'],
      from: data['from'],
      subject: data['subject'],
      text: data['body']
    };

    logger.log('Sending email to: ' + data['to'] + '...');

    sendgrid.send(payload, function(err, json) {
      if (err) {
        logger.error(err);
        context.failure(err);
      } else {
        context.success(json);
      }
    });
  }
};