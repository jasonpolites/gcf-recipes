# Google Cloud Functions Recipes
## Cloud Pub/Sub

### Overview
This recipe shows you how to publish messages to a Cloud Pub/Sub topic from a Cloud Function.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/docs) to setup Cloud Functions for your project

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes/map_reduce


curl -X POST https://us-central1.causal-flame-644.cloudfunctions.net/mapr-reduce --data '{"bucket": "gcf-map-reduce-test", "file": "sample.txt", "mapFunctionUrl": "https://us-central1.causal-flame-644.cloudfunctions.net/mapr-map"}'
