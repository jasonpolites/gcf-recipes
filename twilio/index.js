module.exports = {
  sendSms: function(context, data) {

    // Your accountSid and authToken from twilio.com/user/account
    var accountSid = data['account_sid'];
    var authToken = data['auth_token'];
    var client = require('twilio')(accountSid, authToken);

    console.log('Sending sms to: ' + data['to']);

    client.messages.create({
      body: data['message'],
      to: data['to'],
      from: data['from']
    }, function(err, message) {
      if (err) {
        console.error(err);
        context.failure(err);
      } else {
        console.log(message);
        context.success(message);
      }
    });
  }
};