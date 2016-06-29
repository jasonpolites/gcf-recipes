<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Google Cloud Functions
## Local Execution Emulator

This is a simple emulator that allows you to test your Cloud Functions on your local machine

### Setup

    npm install -g

### Help

    functions -h

### Usage

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

### Deployment

The emulator can host both BACKGROUND and HTTP (foreground) Cloud Functions.  
By default the emulator will consider functions deployed to be BACKGROUND functions. 
To deploy an HTTP function, use the `--trigger-http` argument

    functions deploy <module> <function> --trigger-http

### Examples

Start the Emulator

    functions start    

Deploy a BACKGROUND function

    functions deploy ../myFunction helloWorld

Deploy an HTTP function

    functions deploy ../myFunction helloHttp --trigger-http   

Invoke a function

    functions call helloWorld

If it's an HTTP function

    curl http://localhost:8080/helloWorld

Stop the Emulator

    functions stop     


### Config

A local configuration (**config.js**) file is provided that allows you to configure:

| Property | Type | Description |
|-------|---|----------|
| port | integer | The TCP port on which the emulator will listen (default: 8008) | 
| debug | boolean | True if you want to see logs from the emulator itself (default: false) |
| projectId | string | Your GCP project ID (default:none) |
| timeout | integer | Timeout (ms) to wait for the emulator to start (default:3000) |

### Debugging

To start the emulator in *debug* mode, simply use the `--debug` flag

    functions start --debug

While running in debug mode a separate debug server will be started on port 5858 
(default debugger port for Node).  You can then attach to the debugger process 
with your favorite IDE

#### Debugging with Chrome Developer Tools

If your IDE doesn't support connecting to a Node.js debugger process, you can 
easily debug your Cloud Functions in the emulator using [node-inspector](https://github.com/node-inspector/node-inspector)

First, install node-inspector

    npm install -g node-inspector

Start the emulator in debug mode

    functions start --debug

Now start the node inspector process (we recommend doing this in a separate console window)

    node-inspector

This will start an HTTP server on port 8080, you can then browse to this URL in Chrome

    <http://127.0.0.1:8080/?port=5858>

Now when you invoke your function, you can debug!

    functions call helloWorld

#### Known Issues with Debugging

 - If you see the following error in the console

    `Assertion failed: ((err) == (0)), function Stop, file ../src/debug-agent.cc, line 155.`

    You can safely ignore it.  It's an [open issue](https://github.com/nodejs/node/issues/781) in Node.js

 - If you restart the emulator while the debug server is running you may need to refresh the browser for
   the default debug breakpoint to fire.



