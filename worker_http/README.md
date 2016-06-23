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
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/quickstart) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/worker_http
		
4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4. 	Upload the sample file to the bucket

		gsutil cp sample.txt gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Deploy the "worker" function with an HTTP trigger
	
		gcloud alpha functions deploy mapr-worker --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point worker

6. 	Deploy the "master" function with an HTTP trigger

		gcloud alpha functions deploy mapr-master --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point master
		
7. 	Call the "master" function using the sample file, and the URL of the "worker" function as arguments

		gcloud alpha functions call mapr-master --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt", "workerFunctionUrl": "https://[REGION].[PROJECT-ID].cloudfunctions.net/mapr-worker"}'

8. 	Alternatively because we deployed the functions with HTTP Triggers, you can just cURL the master function

		curl -X POST -H "Content-Type:application/json" https://[REGION].[PROJECT-ID].cloudfunctions.net/mapr-master --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt", "workerFunctionUrl": "https://[REGION].[PROJECT-ID].cloudfunctions.net/mapr-worker"}'

	You can determine the region and URL of your function by using the *describe* command

		gcloud alpha functions describe mapr-worker
		
You should see something like this in your console
```
The file sample.txt has 114 words
```

#### Running Tests
This recipe comes with a suite of unit tests.  To run the tests locally, just use `npm test`

```
npm install
npm test
```

The tests will also produce code coverage reports, written to the `/coverage` directory.  After running the tests, you can view coverage with

```
open coverage/lcov-report/index.html 
```