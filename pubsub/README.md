# Google Cloud Functions Recipes
## Cloud Pub/Sub

### Overview
This recipe shows you how to publish messages to a Cloud Pub/Sub topic from a Cloud Function

### Cooking the Recipe
1.	Follow the Cloud Functions quickstart guide to setup Cloud Functions for your project
2.	Create a Cloud Pub/Sub topic (if you already have one you want to use, you can skip this step):

		gcloud alpha pubsub topics create gcf-recipes-topic

3.  Create a path on your local file system to clone this repo:

		mkdir ~/gcf-recipes-pubsub
		cd ~/gcf-recipes-pubsub

4.	Clone this repository

		git clone https://github.com/jasonpolites/gcf-recipes.git
		
