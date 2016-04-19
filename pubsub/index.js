var gcloud = require("gcloud");

module.exports = {

  /**
   * Publishes a message to a Cloud Pub/Sub Topic 
   */
  "publish" : function (context, data) {
  
    var topicName = data['topic'];
    var message = data['message'];

    if(!topicName) {
      context.failure("Topic not provided.  Make sure you have a 'topic' property in your request");
      return;
    }
    if(!message) {
      context.failure("Message not provided.  Make sure you have a 'message' property in your request");
      return;
    }

    console.log('Publishing message to topic ' + topicName);
    
    // Create a pubsub client
    var pubsub = gcloud.pubsub({
      // We're using the API from the same project as the Cloud Function
      projectId: process.env.GCP_PROJECT,
    });  

    // The Pub/Sub topic must already exist
    var topic = pubsub.topic(topicName);

    // Pub/Sub messages must be valid JSON objects
    topic.publish({
      data: {
        'message': message
      }
    }, function(err) {
      if(err) {
        context.failure(err);
        return;
      } else {
        context.success();
        return;
      }
    });        
  },

  /**
   * Triggered from a message on a Pub/Sub topic 
   */
  "subscribe" : function (context, data) {
    // We're just going to log the message to prove that it worked!
    console.log(data['message']);

    // Don't forget to call success!
    context.success();
  }
}
