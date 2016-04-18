# Google Cloud Functions Recipes
## Cloud Storage

### Overview
This recipe demonstrates how to load a file from Cloud Storage

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/gcs
		
4. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4. 	Upload the sample file to the bucket

		gsutil cp sample.txt gs://[PROJECT-ID]-gcf-recipes-bucket

5.	Deploy the "wordCount" function with an HTTP trigger
	
		gcloud alpha functions deploy wordCount --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point map

6. 	Call the "wordCount" function using the sample file

		gcloud alpha functions call wordCount --data '{"bucket": "[PROJECT-ID]-gcf-recipes-bucket", "file": "sample.txt"}'
		
You should see something like this in your console
```
The file sample.txt has 119 words
```
