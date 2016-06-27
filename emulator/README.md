<img src="https://avatars2.githubusercontent.com/u/2810941?v=3&s=96" alt="Google Cloud Platform logo" title="Google Cloud Platform" align="right" height="96" width="96"/>

# Google Cloud Functions
## Local Execution Emulator

This is a simple emulator that allows you to test your Cloud Functions on your local machine

Setup:

    npm install -g

Usage: 

    functions [options] [command]

    Commands:

    start                                 Starts the emulator
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


Examples:

Start the emulator

    functions start

Stop the emulator

    functions stop

Restart the emulator

    functions restart    

Deploy a function

    functions deploy ../myFunction helloWorld

Invoke a function

    functions call helloWorld

If it's an HTTP function

    curl http://localhost:8080/helloWorld

List deployed functions

    functions list

Undeploy a function

    functions undeploy helloWorld