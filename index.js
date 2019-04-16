const jwt = require('jsonwebtoken');
const http2 = require('http2');
const querystring = require('querystring');

module.exports = class ApplePush {

	/**
	 * Constructor method for the ApplePush class.
	 * Will set the `url` attribute to the sandbox or production
	 * urls for the APNS server depending upon the value
	 * of the NODE_ENV environment variable.
	 * 
	 * @return {ApplePush} A new instance of type ApplePush
	 */
	 constructor() {
	 	if (process.env.NODE_ENV === "production") {
	 		this.url = "https://api.push.apple.com";
	 	} else {
	 		this.url = "https://api.sandbox.push.apple.com";
	 	}

	 	/**
	 	 * A map of the various network errors that can be encountered
	 	 * while sending out the push to APNS.
	 	 * 
	 	 * @type {Object}
	 	 */
	 	 this.ERRORS = {
	 	 	400: "Bad request",
	 	 	403: "There was an error with the certificate or with the provider’s authentication token.",
	 	 	405: "The request used an invalid :method value. Only POST requests are supported.",
	 	 	410: "The device token is no longer active for the topic.",
	 	 	413: "The notification payload was too large.",
	 	 	429: "The server received too many requests for the same device token.",
	 	 	500: "Internal server error.",
	 	 	503: "The server is shutting down and unavailable."
	 	 };

	 	}

	/**
	 * Sends a new push notification via the APNS service
	 * The method uses the APNS service in a stateless manner making use of a shortlived
	 * HTTP/2 session.
	 * 
	 * @param  {Any} payload - Can be a `string` or `object`  to be posted  
	 * @param  {String} jwt - json web token to sent for authentication
	 * 
	 * @return {Promise} A promise that resolves if the request is successful or rejects
	 * with an error 
	 */
	 push (payload, jwt, deviceToken, bundleId, options) {
	 	return new Promise((resolve, reject) => {
	 		if (!payload) {
	 			reject(Error('Parameter `payload` is required'));
	 			return;
	 		}
	 		if (!jwt) {
	 			reject(Error('Parameter `jwt` is required'));
	 			return;	
	 		}
	 		if (!deviceToken) {
	 			reject(Error('Parameter `deviceToken` is required'));
	 			return;	
	 		}
	 		if (!bundleId) {
	 			reject(Error('Parameter `bundleId` is required'));
	 			return;	
	 		}
	 		const session = http2.connect(this.url);
	 		const sessionErrorHandler = (error) => {
	 			session.destroy();
	 			reject(error);
	 		}

	 		session.on('error', sessionErrorHandler);
	 		session.on('socketError', sessionErrorHandler);
	 		session.on('goaway', sessionErrorHandler);

	 		let headers = { 
	 			':path': `/3/device/${deviceToken}`,
	 			':method': 'POST',
	 			'authorization': `bearer ${jwt}`,
	 			'apns-topic': bundleId
	 		};

	 		if (options) {
	 			if (options.id) { headers['apns-id'] = options.id; }
	 			if (options.expiration) { headers['apns-expiration'] = options.expiration; }
	 			if (options.priority) { headers['apns-priority'] = options.priority; }
	 			if (options.collapseId) { headers['apns-collapse-id'] = options.collapseId; }
	 		}

	 		const req = session.request(headers);

	 		req.on('aborted', error => {
	 			req.close();
	 			sessionErrorHandler(error);
	 		});

	 		req.on('response', (headers, flags) => {
	 			let data = '';
	 			req.on('data', chunk => { data += chunk; }).on('end', () => {
	 				if (headers[":status"] === 200) {
	 					resolve({
	 						"status": 200,
	 						"apns-id": headers['apns-id']
	 					});
	 				} else {
	 					data = JSON.parse(data);
	 					let error = undefined;
	 					let errorText = this.ERRORS[headers[":status"]];
	 					if (errorText) {
	 						error = new Error(errorText);
	 						error.reason = data.reason;
	 						error["apns-id"] = headers["apns-id"];
	 					} else {
	 						error = new Error(`Remote server responded with error code ${headers[':status']}`)
	 					}
	 					reject(error);
	 				}
	 				session.destroy();
	 			});
	 		});
	 		const postbody = querystring.stringify(payload);
	 		req.end(postbody);
	 	});
	 }

	/**
	 * Create a new JWT according to the APNS specifications.
	 * 
	 * @param  {String} teamId - The teamId of the organization
	 * @param  {String} keyId - The key id for the application
	 * @param  {String} key - The key to be used for signing
	 * 
	 * @return {Promise} A Promise that resolves with the JWT 
	 * or rejects if there was an error
	 */
	 createToken(teamId, keyId, key) {
	 	return new Promise((resolve, reject) => {
	 		if (!teamId) {
	 			reject( new Error('Parameter `teamId` is required') );
	 			return;
	 		}

	 		if (!keyId) {
	 			reject( new Error('Parameter `keyId` is required') );
	 			return;
	 		}

	 		if (!key || key.trim() === "") {
	 			reject( new Error('Parameter `key` is required') );
	 			return;
	 		}

	 		let signingOptions = {
	 			issuer: teamId,
	 			algorithm: 'ES256',
	 			header: {
	 				kid: keyId
	 			}
	 		};
	 		jwt.sign({}, key, signingOptions, (err, token) => {
	 			if (err) {
	 				reject(err);
	 			} else {
	 				try {
	 					const result = token;
	 					resolve(result);
	 				} catch(error) {
	 					reject(error);
	 				}
	 			}
	 		});
	 	});
	 }

	}