# Google Cloud Functions Recipes
## Cloud Pub/Sub

### Overview
This recipe shows you how to publish messages to a Cloud Pub/Sub topic from a Cloud Function

### Cooking the Recipe
1.	Follow the Cloud Functions quickstart guide to setup Cloud Functions for your project
2.	Create a Cloud Pub/Sub topic (if you already have one you want to use, you can skip this step):

		gcloud alpha pubsub topics create gcf-recipes-topic

3.	Create a path on your local file system to clone this repo:

		mkdir ~/gcf-recipes-pubsub
		cd ~/gcf-recipes-pubsub

4.	Clone this repository

		git clone https://github.com/jasonpolites/gcf-recipes.git
		
5. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://gcf-recipes-bucket

6.	Deploy the "publish" function with an HTTP trigger
	
		gcloud alpha functions deploy publish --bucket gcf-recipes-bucket --trigger-http

7. 	Deploy the "subscribe" function with the Pub/Sub topic as a trigger

		gcloud alpha functions deploy subscribe --bucket gcf-recipes-bucket --trigger-topic gcf-recipes-topic
		
8. 	Call the "publish" function

		gcloud alpha functions call publish --data '{"topic": "gcf-recipes-topic", "message": "Hello World!"}' 
		
9.	Check the logs for the "subscribe" function

		gcloud alpha functions get-logs subscribe
