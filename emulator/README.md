<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Google Cloud Functions
## Local Execution Emulator

This is a simple emulator that allows you to test your Cloud Functions on your local machine

**Setup:**

    npm install -g

**Help:**

    functions -h

**Usage:**

    functions [options] [command]

        Commands:

        start [options]                       Starts the emulator
        stop                                  Stops the emulator
        restart                               Restarts the emulator
        clear                                 Resets the emulator to its default state and clears any deploy functions
        status                                Returns the status of the emulator
        deploy [options] <module> <function>  Deploys a function with the given module path and entry point
        undeploy <function>                   Removes a previously deployed function
        list                                  Lists deployed functions
        describe <function>                   Describes the details of a single deployed function
        call [options] <function>             Invokes a function

        Options:
        -h, --help     output usage information

**Deployment:**

Deploying a function takes an optional `--type` argument

    deploy [options] <module> <function>

        Deploys a function with the given module path and entry point

        Options:

        --type <type>  The type of the function.  One of HTTP (H) or BACKGROUND (B).  Default is BACKGROUND
    

**Examples:**

Deploy a function

    functions start
    functions deploy ../myFunction helloWorld

Invoke a function

    functions call helloWorld

If it's an HTTP function

    curl http://localhost:8080/helloWorld

**Config:**

A local configuration (**config.js**) file is provided that allows you to configure:

| Property | Type | Description |
|-------|---|----------|
| port | integer | The TCP port on which the emulator will listen (default: 8080) | 
| debug | boolean | True if you want to see logs from the emulator itself (default: false) |
| projectId | string | Your GCP project ID (default:none) |

