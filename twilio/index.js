// Use our logging utilty just as a convenience to skip 
// console logs during tests
var logger = require('./logger');

module.exports = {
  sendSms: function(context, data) {

    // Your accountSid and authToken from twilio.com/user/account
    var accountSid = data['account_sid'];
    var authToken = data['auth_token'];
    var client = require('twilio')(accountSid, authToken);

    logger.log('Sending sms to: ' + data['to']);

    client.messages.create({
      body: data['message'],
      to: data['to'],
      from: data['from']
    }, function(err, message) {
      if (err) {
        logger.error(err);
        context.failure(err);
      } else {
        context.success(message);
      }
    });
  }
};