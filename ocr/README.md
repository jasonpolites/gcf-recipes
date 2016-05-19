# Google Cloud Functions Recipes
## OCR with Cloud Vision API and Google Translate API

### Overview
This recipe shows you how to use the Cloud Vision API together with the Google Translate API using Cloud Pub/Sub as a message bus.  Where applicable:

**Replace [PROJECT-ID] with your Cloud Platform project ID**

### Cooking the Recipe
1.	Follow the [Cloud Functions quickstart guide](https://cloud.google.com/functions/quickstart) to setup Cloud Functions for your project

2. 	Enable the [Vision API](https://console.cloud.google.com/flows/enableapi?apiid=vision.googleapis.com) and the [Translate API](https://console.cloud.google.com/flows/enableapi?apiid=translate)

3.	[Create a Google Translate API Key](https://cloud.google.com/translate/v2/translating-text-with-rest#auth) and replace the value in [config.js](app/config.js)

2.	Clone this repository

		cd ~/
		git clone https://github.com/jasonpolites/gcf-recipes.git
		cd gcf-recipes
		
3.	Run the setup for the ocr sample:
	
	```
	npm install
	node setup install ocr [PROJECT-ID]
	```

4. 	Upload a sample image

		gsutil cp ocr/samples/sample_ch.png gs://[PROJECT-ID]-gcf-samples-ocr-in/ 

5.	Pull the extracted text from the bucket and pipe to standard out

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