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
			this.url = "https://api.push.apple.com:443";
		} else {
			this.url = "https://api.sandbox.push.apple.com:443";
		}
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
	push (payload, jwt, deviceToken, options) {
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
				'authorization': `bearer ${jwt}`
			};

			if (options) {
				if (options.id) { headers['apns-id'] = options.id; }
				if (options.expiration) { headers['apns-expiration'] = options.expiration; }
				if (options.priority) { headers['apns-priority'] = options.priority; }
				if (options.topic) { headers['apns-topic'] = options.topic; }
				if (options.collapseId) { headers['apns-collapse-id'] = options.collapseId; }
			}

			const req = session.request(headers);
			req.on('aborted', error => {
				req.close();
				sessionErrorHandler(error);
			});

			req.on('response', (headers, flags) => {
				switch(headers[':status']) {
					case 200: {
						let data = '';
		        		req.on('data', chunk => { data += chunk; }).on('end', () => {
		             		try {
		             			console.log(data);
		               			const response = JSON.parse(data);
		               			resolve(response);
		             		} catch (err) { 
		             			reject(err); 
		             		} finally { 
		             			session.destroy(); 
		             		}
			           });
			           break;
					}
					case 400: {
						reject(new Error(`Bad request`));
						break;
					}
					case 403: {
						reject(new Error(`There was an error with the certificate or with the provider’s authentication token.`));
						break;
					}
					case 405: {
						reject(new Error(`The request used an invalid :method value. Only POST requests are supported.`));
						break;
					}
					case 410: {
						reject(new Error(`The device token is no longer active for the topic.`));
						break;
					}
					case 413: {
						reject(new Error(`The notification payload was too large.`));
						break;
					}
					case 429: {
						reject(new Error(`The server received too many requests for the same device token.`));
						break;
					}
					case 500: {
						reject(new Error(`Internal server error.`));
						break;
					}
					case 500: {
						reject(new Error(`The server is shutting down and unavailable.`));
						break;
					}
					default: new Error(`Remote server responded with error code ${headers[':status']}`); break;
				}
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