# Google Cloud Functions Recipes
## Local Execution Helper

### Pre-requisits

 - You need [Node.js](https://www.nodejs/org) installed locally
 - It's *recommended* that you have the [Cloud SDK](https://cloud.google.com/sdk/) installed
 
### Usage

    Usage: call [options] <module> <function>

    Execute the node module given by the module argument

    Options:

      -h, --help            output usage information
      -V, --version         output the version number
      --project-id [id]     Your Cloud Platform project id
      --keyFilename [path]  The path to your oAuth key file
      --data [json]         The payload to be sent to the function
