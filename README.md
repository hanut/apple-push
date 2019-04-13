# apple-push
Node.js module for sending push notifications via the apple push notification service. This module uses token based authentication and implements a RESTful interface instead of using long lived socket connections.

## Running Tests
To run the tests included you need to setup the environment 
with something like the following - 

````
# Optional for debug mode
export NODE_ENV='debug'

# The teamid, keyid and key are required
export teamid="ABCD123EFG"
export keyid="GHI123JKL"
export key="elemenohpee"
````