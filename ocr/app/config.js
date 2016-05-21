/******************************************************************************
 * OCR Recipe Configuration Module
 *****************************************************************************/

// Set your Google translate API key
var translateApiKey = "<API KEY>";

try {
    translateApiKey = require('./translate_apikey.json');
} catch (e) {
    console.error('Could not find a local translate_apikey.json file.  ' +
        'Make sure you create a Translate API key and add it to your module');
}

module.exports = function(projectId) {
    return {
        // The topic that will receive final text results
        result_topic: 'gcf-ocr-result',

        // The topic on which translation requests will be made
        translate_topic: 'gcf-ocr-translate',

        // The name of the gcs bucket to which we will write results
        result_bucket: projectId + '-gcf-samples-ocr-out',

        // API Key for Google Translate
        // SET THIS IN translate_apikey.json!
        translate_key: translateApiKey,

        // True if we should translated extracted text
        translate: true,

        // The languages we will translate into
        to_lang: ['en', 'fr', 'es', 'ja', 'ru']
    };
};