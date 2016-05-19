/******************************************************************************
 * OCR Recipe Configuration Module
 *****************************************************************************/
module.exports = function(projectId) {
  return {
    // The topic that will receive final text results
    result_topic: 'gcf-ocr-result',

    // The topic on which translation requests will be made
    translate_topic: 'gcf-ocr-translate',

    // The name of the gcs bucket to which we will write results
    result_bucket: 'gcf-tests-gcf-samples-ocr-out',

    // API Key for Google Translate
    translate_key: 'AIzaSyCnw3W4MFKLs2Vv4Q-iyl6l6dTZJQRuhOI',

    // True if we should translated extracted text
    translate: true,

    // The languages we will translate into
    to_lang: ['en', 'fr', 'es', 'ja', 'ru']
  };
};