const jwt = require('jsonwebtoken');
const http2 = require('http2');


module.exports = class ApplePush {

	constructor() {

	}

	post () {
		const client = http2.connect('https://localhost:8443', {
		  ca: fs.readFileSync('localhost-cert.pem');
		});
		
		client.on('error', (err) => console.error(err));

		const req = client.request({ ':path': '/' });

		req.on('response', (headers, flags) => {
		  for (const name in headers) {
		    console.log(`${name}: ${headers[name]}`);
		  }
		});

		req.setEncoding('utf8');
		let data = '';
		req.on('data', (chunk) => { data += chunk; });
		req.on('end', () => {
		  console.log(`\n${data}`);
		  client.close();
		});
		req.end();
	}

	createToken(payload, options) {
		let teamID = options.teamId || false;
		let keyID = options.keyId || false;
		let key = options.key || false;

		if (!teamID) {
			let error = new Error();
			error.message = 'teamId field is required';
			error.code = 10;
			throw error;
		}

		if (!keyID) {
			let error = new Error();
			error.message = 'keyId field is required';
			error.code = 11;
			throw error;
		}

		if (!key || key.trim() === "") {
			let error = new Error();
			error.message = 'key field is required';
			error.code = 12;
			throw error;
		}

		return new Promise((resolve, reject) => {
			var token = jwt.sign("", keyValue, { header: });
		});
	}

	refreshToken() {

	}

}