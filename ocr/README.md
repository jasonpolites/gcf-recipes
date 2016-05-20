# Google Cloud Functions Recipes
## OCR with Cloud Vision API and Google Translate API

### Overview
This recipe shows you how to use the Cloud Vision API together with the Google Translate API using Cloud Pub/Sub as a message bus.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/quickstart) to setup Cloud Functions for your project

2. 	Enable the [Vision API](https://console.cloud.google.com/flows/enableapi?apiid=vision.googleapis.com&redirect=https://github.com/jasonpolites/gcf-recipes/tree/master/ocr) and the [Translate API](https://console.cloud.google.com/flows/enableapi?apiid=translate&redirect=https://github.com/jasonpolites/gcf-recipes/tree/master/ocr)

3.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes
		

4.	[Create a Google Translate API Key](https://cloud.google.com/translate/v2/translating-text-with-rest#auth)

5.	Create a file called `translate_apikey.json` and copy the Translate API Key into this file **as a String**

		echo "\"[YOUR API KEY]\"" > ocr/app/translate_apikey.json

4.	Run the setup for the ocr sample:
	
	```
	npm install
	node setup install ocr [PROJECT-ID]
	```

5. 	Upload a sample image

		gsutil cp ocr/samples/sample_ch.jpg gs://[PROJECT-ID]-gcf-samples-ocr-in/ 

6.	Watch the logs to make sure the executions have completed

		gcloud alpha functions get-logs --limit 100

6.	Pull the extracted text from the bucket and pipe to standard out

		gsutil cat gs://[PROJECT-ID]-gcf-samples-ocr-out/sample_ch_to_en.txt

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
