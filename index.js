const jwt = require('jsonwebtoken');


module.exports = class ApplePush {

	constructor() {

	}

	createToken(payload, options) {
		return new Promise((resolve, reject) => {
			var token = jwt.sign("", keyValue, { header: });
		});
	}

	refreshToken() {

	}

}