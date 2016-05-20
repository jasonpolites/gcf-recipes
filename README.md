[![](https://travis-ci.org/jasonpolites/gcf-recipes.svg?branch=master)](https://travis-ci.org/jasonpolites/gcf-recipes)
[![Coverage Status](https://coveralls.io/repos/github/jasonpolites/gcf-recipes/badge.svg?branch=master)](https://coveralls.io/github/jasonpolites/gcf-recipes?branch=master)
# Google Cloud Functions Recipes (Unofficial)

 - Publishing messages to [Google Cloud Pub/Sub](/pubsub)
 - Reading from a [Google Cloud Storage](/gcs) Bucket
 - [Word Count Master/Worker](/worker_http) example using HTTP Invocation
 - [Word Count Master/Worker](/worker_pubsub) example using Cloud Pub/Sub
 - [Sending email](/sendgrid) with SendGrid
 - [Sending SMS](/twilio) messages with Twilio
 - Reading and Writing with [Google Cloud Datastore](/datastore)
 - Exporting data to [Google Cloud BigQuery](/bigquery)
 - [OCR using Cloud Vision API](/ocr) and Google Translate API

## Notes on deployment
If you have a large number of dependencies in your `package.json` file and you run `npm install` locally, you may find deployments to be slow because you will be deploying your fully-materialized `node_modules` folder.  If you don't have any private modules in your `node_modules` folder we recommend you `rm -rf node_modules` prior to invoking `deploy`

*Coming Soon...*

 - Processing Cloud Logging events
 - Responding to Google Drive events
 - Processing GMail events
 - Authentication
  - Using HTTP Basic Authentication
  - Using a simple shared key
  - Validating JSON Web Tokens (JWTs)
 - Sending messages to a Slack channel
 - Making payments with Stripe
 - Executing algorithms in Algorithmia.io
