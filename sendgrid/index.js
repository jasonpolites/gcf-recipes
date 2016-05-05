
module.exports = {
  "sendEmail" : function (context, data) {
    // using SendGrid's Node.js Library - https://github.com/sendgrid/sendgrid-nodejs
    var sendgrid = require("sendgrid")(data['sg_key']);

    var payload   = {
      to      : data['to'],
      from    : data['from'],
      subject : data['subject'],
      text    : data['body']
    }

    console.log("Sending email to: " + data['to'] + "...");

    sendgrid.send(payload, function(err, json) {
      if (err) { 
        console.error(err);
        context.failure(err);
      } else {
        console.log(json);
        context.success(json);
      }
    });
  }
}

