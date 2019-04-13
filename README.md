# apple-push
Node.js module for sending push notifications via the apple push notification service. 

It uses token based authentication and aims to be *a 100% compliant* with Apple's
specifications.

## Running Tests
To run the tests included you need to setup the environment 
with something like the following - 

````
# Optional for debug mode
export NODE_ENV='debug'

# The teamid, keyid and key are required
export teamid="<your apple developer teamid>"
export key="<your token signing key>"
export keyid="<your token signing key's id>"
export bundleid="<your apps bundleid>"
export devicetoken="<your ios device token>"
````