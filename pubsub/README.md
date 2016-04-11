# Google Cloud Functions Recipes
## Cloud Pub/Sub

### Overview
This recipe shows you how to publish messages to a Cloud Pub/Sub topic from a Cloud Function

### Cooking the Recipe
1.	Follow the Cloud Functions quickstart guide to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/pubsub
		
3.	Create a Cloud Pub/Sub topic (if you already have one you want to use, you can skip this step):

		gcloud alpha pubsub topics create gcf-recipes-topic		

4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Deploy the "publish" function with an HTTP trigger
	
		gcloud alpha functions deploy publish --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http

6. 	Deploy the "subscribe" function with the Pub/Sub topic as a trigger

		gcloud alpha functions deploy subscribe --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-topic gcf-recipes-topic
		
7. 	Call the "publish" function

		gcloud alpha functions call publish --data '{"topic": "gcf-recipes-topic", "message": "Hello World!"}' 
		
8.	Check the logs for the "subscribe" function

		gcloud alpha functions get-logs subscribe
