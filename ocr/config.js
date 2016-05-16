/******************************************************************************
 * OCR Recipe Configuration Module
 *****************************************************************************/
module.exports = function(projectId) {

  return {
    // The topic that will receive final text results
    result_topic: 'gcf-ocr-result',

    // The topic on which translation requests will be made
    translate_topic: 'gcf-ocr-translate'

    // API Key for Google Translate
    translate_key: 'AIzaSyCnw3W4MFKLs2Vv4Q-iyl6l6dTZJQRuhOI',

    // The Bigquery dataset into which we will import data
    dataset: 'gcf_bq_dataset',

    // The Bigquery table into which we will import data
    table: 'gcf_bq_table',

    // The Bigquery table needs a schema.  This is designed to match the
    // sample file (dc-wikia-data.csv)
    schema: 'page_id:integer, name:string, urlslug:string, ID:string, ' +
      'ALIGN:string, EYE:string, HAIR:string, SEX:string, GSM:string, ' +
      'ALIVE:string, APPEARANCES:integer, FIRST_APPEARANCE:string, ' +
      'YEAR:integer',

    // The time, in milliseconds, we are prepared to wait for the import
    // job to complete
    job_timeout: 5000
  };
};