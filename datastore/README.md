# Google Cloud Functions Recipes
## Cloud Datastore

### Overview
This recipe shows you how to read and write an entity in Datastore from a Cloud Function.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/quickstart) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/datastore
		
3. 	Create a Cloud Storage Bucket to stage our deployment

		gsutil mb gs://[PROJECT-ID]-gcf-recipes-bucket

4.	Ensure the Cloud Datastore API is enabled

	[Click here to enable the Cloud Datastore API](https://console.cloud.google.com/flows/enableapi?apiid=datastore.googleapis.com&redirect=https://github.com/jasonpolites/gcf-recipes/tree/master/datastore)

4.	Deploy the "ds-get" function with an HTTP trigger
	
		gcloud alpha functions deploy ds-get --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point get

5.	Deploy the "ds-set" function with an HTTP trigger
	
		gcloud alpha functions deploy ds-set --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point set

6.	Deploy the "ds-del" function with an HTTP trigger
	
		gcloud alpha functions deploy ds-del --bucket [PROJECT-ID]-gcf-recipes-bucket --trigger-http --entry-point del		
		
7. 	Call the "ds-set" function to create a new entity

		gcloud alpha functions call ds-set --data '{"kind": "gcf-test", "key": "foobar", "value": {"message": "Hello World!"}}' 

8. 	Call the "ds-get" function to read the newly created entity

		gcloud alpha functions call ds-get --data '{"kind": "gcf-test", "key": "foobar"}' 		

9. 	Call the "ds-del" function to delete the entity

		gcloud alpha functions call ds-del --data '{"kind": "gcf-test", "key": "foobar"}' 			
		
10. Call the "ds-get" function again to verify it was deleted

		gcloud alpha functions call ds-get --data '{"kind": "gcf-test", "key": "foobar"}' 
