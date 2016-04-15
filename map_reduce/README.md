# Google Cloud Functions Recipes
## Word Count Sample

### Overview
This recipe demonstrates how to create a simple word count sample using a map-reduce pattern.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/map_reduce
		
4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4. 	Upload the sample file to the bucket

		gsutil cp sample.txt gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Deploy the "map" function with an HTTP trigger
	
		gcloud alpha functions deploy mapr-map --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http

6. 	Deploy the "reduce" function with an HTTP trigger

		gcloud alpha functions deploy mapr-reduce --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http
		
7. 	Call the "reduce" function using the sample file, and the URL of the "map" function arguments

		gcloud alpha functions call mapr-reduce --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt", "mapFunctionUrl": "https://[REGION].[PROJECT-ID].cloudfunctions.net/mapr-map"}'

You can determine the region and URL of your function by using the *describe* command

		gcloud alpha functions describe mapr-map
		
You should see something like this in your console
```
The file sample.txt has 119 words
```
