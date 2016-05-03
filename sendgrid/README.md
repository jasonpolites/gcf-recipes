# Google Cloud Functions Recipes
## Sending email with SendGrid

### Overview
This recipe shows you how to send an email from a Cloud Function using SendGrid.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/sendgrid
		
3.	Create an account on Sendgrid.  You can either do this manually via the [SendGrid website](https://sendgrid.com/free), or you can use the [Google Cloud Launcher](https://cloud.google.com/launcher) which will create an account for you and also integrate billing

	[Create a SendGrid account using Cloud Launcher](https://cloud.google.com/launcher/solution/sendgrid-app/sendgrid-email)

4. 	Create SendGrid API key

		- Log in to your SendGrid account at [https://app.sendgrid.com](https://app.sendgrid.com)
		- Navigate to Settings->API Keys
		- Create a new "General API Key"
		- Ensure you select (at least) the "Mail Send" permission when you create the API key
		- Copy the API Key when it is displayed (you will only see this once, make sure you paste it somewhere!)

5. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

6.	Deploy the "sendEmail" function with an HTTP trigger
	
		gcloud alpha functions deploy sendEmail --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http

8. 	Call the "sendEmail" function 
	
	(replace SENDGRID_KEY with your SendGrid API KEY, RECIPIENT_ADDR with the recipient's email address, and SENDER_ADDR with your SendGrid account's email address)

		gcloud alpha functions call sendEmail --data '{"sg_key": "[SENDGRID_KEY]", "to": "[RECIPIENT_ADDR]", "from": "[SENDER_ADDR]", "subject": "Hello from Sendgrid!", "body": "Hello World!"}' 
		
9.	Check the logs for the "sendEmail" function

		gcloud alpha functions get-logs sendEmail
		
	
You should see something like this in your console
```
D      ... User function triggered, starting execution
I      ... Sending email to: [RECIPIENT_ADDR]
D      ... Execution took 1 ms, user function completed successfully
```
