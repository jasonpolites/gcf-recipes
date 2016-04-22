# Google Cloud Functions Recipes
## Word Count Sample

### Overview
This recipe demonstrates how to create a simple word count sample using a master-worker pattern using Cloud Pub/Sub.  

Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### What's going on here?

![Distributed Worker (Pub/Sub)](images/readme.png "Distributed Worker (Pub/Sub)")

1. 	Client calls the "master" function via HTTP
2.	Master function pulls file from Google Cloud Storage
3.	Master function segments the file and published mutliple messages to the "In Topic"
4.	Cloud Functions allocates multiple workers (as necessary) to process segment messages and workers publish results to "Out Topic"
5. 	Master function subscribes to "Out Topic" and collects results from workers
6. 	Master function returns aggregate result to the client

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/worker_pubsub
		
4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4. 	Upload the sample file to the bucket

		gsutil cp sample.txt gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Create a Pub/Sub Topic for the workers to subscribe to

		gcloud alpha pubsub topics create gcf-mapr-in

5.	Create a Pub/Sub Topic for the workers to publish to

		gcloud alpha pubsub topics create gcf-mapr-out		

6. 	Deploy the "master" function with an HTTP trigger
	
		gcloud alpha functions deploy mapr-pubsub-master --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point master

6. 	Deploy the "worker" function with a Pub/Sub trigger, using the 'gcf-mapr-in' topic as the source

		gcloud alpha functions deploy mapr-pubsub-worker --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-topic gcf-mapr-in --entry-point worker
		
7. 	Call the "master" function using the sample file, with both topics as function arguments

		gcloud alpha functions call mapr-pubsub-master --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt", "in-topic": "gcf-mapr-in", "out-topic":"gcf-mapr-out"}'
		
You should see something like this in your console
```
The file sample.txt has 114 words
```