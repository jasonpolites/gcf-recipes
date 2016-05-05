/******************************************************************************
 * Bigquery Recipe Configuration Module
 *****************************************************************************/
module.exports = function(projectId) {

	// Bigquery doesn't like hyphens
	var bq_pid = projectId.replace(/-/g, '_');

	return {
		// The bucket to which processed files will be moved
		'processed_bucket' : projectId + '-bq-processed',

		// The Bigquery dataset into which we will import data
		'dataset' : bq_pid + '_bq_dataset',	

		// The Bigquery table into which we will import data
		'table' : bq_pid + '_bq_table',

		// The Bigquery table needs a schema.  This is designed to match the 
		// sample file (dc-wikia-data.csv)
		'schema' : 'page_id:integer, name:string, urlslug:string, ID:string, ' + 
			'ALIGN:string, EYE:string, HAIR:string, SEX:string, GSM:string, ' + 
			'ALIVE:string, APPEARANCES:integer, FIRST_APPEARANCE:string, ' + 
			'YEAR:integer',

		// The time, in milliseconds, we are prepared to wait for the import
		// job to complete
		'job_timeout' : 5000
	};
};
