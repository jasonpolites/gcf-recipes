# Google Cloud Functions Recipes
## Sending email with Twilio

### Overview
This recipe shows you how to send an SMS message from a Cloud Function using Twilio.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/twilio
		
3.	Create an account on [Twilio](https://www.twilio.com/try-twilio)

4. 	Grab your Twilio Account SID & Auth Token.  These will be visible in your [Twilio Console](https://www.twilio.com/console)

5. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

6.	Deploy the "sendSms" function with an HTTP trigger
	
		gcloud alpha functions deploy sendSms --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http

8. 	Call the "sendSms" function:
		
		gcloud alpha functions call sendSms --data '{"account_sid": "[TWILIO_SID]", "auth_token": "[TWILIO_TOKEN]", "from": "[FROM_NUM]", "to": "[TO_NUM]" "message": "Hello from Cloud Functions!"}' 

	- Replace **TWILIO_SID** with your Twilio Account SID
	- Replace **TWILIO_TOKEN** with the Twilio Auth Token
	- Replace **FROM_NUM** with your (verfied) sender phone number (in international format, e.g +14151112222)
	- Replace **TO_NUM** with your recipient number (in international format, e.g +14151112222)
		
9.	Check the logs for the "sendSms" function

		gcloud alpha functions get-logs sendEmail
	
You should see something like this in your console
```
D      ... User function triggered, starting execution
I      ... Sending sms to: [TO_NUM]
D      ... Execution took 1 ms, user function completed successfully
```
