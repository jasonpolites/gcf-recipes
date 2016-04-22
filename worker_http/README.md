# Google Cloud Functions Recipes
## Word Count Sample

### Overview
This recipe demonstrates how to create a simple word count sample using a master-worker pattern using HTTP invocation.  

Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### What's going on here?

![Distributed Worker (HTTP)](images/readme.png "Distributed Worker (HTTP)")

1. 	Client calls the "master" function via HTTP
2.	Master function pulls file from Google Cloud Storage
3.	Master function segments the file and fans out requests to multiple workers
4.	Worker functions process each segment and report the result back to the master
5. 	Master function reduces all results from workers into a single result
6. 	Master function returns aggregate result to the client

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/worker_http
		
4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4. 	Upload the sample file to the bucket

		gsutil cp sample.txt gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Deploy the "map" function with an HTTP trigger
	
		gcloud alpha functions deploy mapr-map --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point map

6. 	Deploy the "reduce" function with an HTTP trigger

		gcloud alpha functions deploy mapr-reduce --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point reduce
		
7. 	Call the "reduce" function using the sample file, and the URL of the "map" function arguments

		gcloud alpha functions call mapr-reduce --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt", "mapFunctionUrl": "https://[REGION].[PROJECT-ID].cloudfunctions.net/mapr-map"}'

	You can determine the region and URL of your function by using the *describe* command

		gcloud alpha functions describe mapr-map
		
You should see something like this in your console
```
The file sample.txt has 114 words
```
