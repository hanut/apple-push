const expect = require('chai').expect;
const ApplePush = require('../index');
const jwt = require('jsonwebtoken');
let uuid5 = require("uuid5");

const teamid = process.env.teamid || false;
const keyid = process.env.keyid || false;
const key = process.env.key || false;
const devicetoken = process.env.devicetoken || false;
const bundleid = process.env.bundleid || false;

if (!teamid || !keyid || !key || !devicetoken) {
	console.error('Please setup the test environment correctly');
	process.exit(-1);
}

describe('Test Suit for apple-push module', function() {

	it('should export a function', function() {
		expect(ApplePush).is.a('function');
	});

	it('should return new instances of type ApplePush', function() {
		let apns = new ApplePush();
		expect(apns instanceof ApplePush).is.eq(true);
	});

	describe('Class Structure', function() {
		let apns = new ApplePush();

		it('should contain `url` attribute', function() {
			expect(apns.url).is.a('string');
		});

		it('should contain `push` method', function() {
			expect(apns.push).is.a('function');
		});

		it('should contain `createToken` method', function() {
			expect(apns.createToken).is.a('function');
		});
	});

	describe('#createToken()', function() {
		let apns = new ApplePush();
		
		it('should return a promise', function() {
			let result = apns.createToken();
			expect(result).is.a('promise');
			result.catch(error => error);
		});

		context('Missing / Incorrect parameters in function call', function() {
			it('should check for invalid/missing teamId', function(done) {
				apns.createToken().then(() => {
					done(new Error('Check for missing teamId failed'));	
				}).catch(error => {
					done();	
				});
			});

			it('should check for invalid/missing keyId', function(done) {
				apns.createToken('abcd').then(() => {
					done(new Error('Check for missing keyId failed'));	
				}).catch(error => {
					done();	
				});
			});

			it('should check for invalid/missing key', function(done) {
				apns.createToken('abcd', 'efgh').then(() => {
					done(new Error('Check for missing key failed'));	
				}).catch(error => {
					done();	
				});
			});
		});

		context('Successful function call', function() {
			it('should return an valid apns jwt token', function(done) {
				apns.createToken(teamid, keyid, key).then(token => {
					expect(token).is.a('string');
					done();
				}).catch(done);
			});
		});
	});


	describe('#push()', function() {
		let apns = undefined;
		let token = undefined;
		
		before(async function() {
			apns = new ApplePush();
			token = await apns.createToken(teamid, keyid, key);
		});

		it('should return a promise', function() {
			let result = apns.push();
			expect(result).is.a('promise');
			result.catch(error => error);
		});

		context('Missing / Incorrect parameters in function call', function() {
			it('should check for invalid/missing payload', function(done) {
				apns.push().then(() => {
					done(new Error('Check for missing payload failed'));	
				}).catch(error => {
					done();	
				});
			});
			
			it('should check for invalid/missing jwt', function(done) {
				apns.push('abcd').then(() => {
					done(new Error('Check for missing jwt failed'));	
				}).catch(error => {
					done();	
				});
			});

			it('should check for invalid/missing deviceToken', function(done) {
				apns.push('abcd', 'qwe123').then(() => {
					done(new Error('Check for missing deviceToken failed'));	
				}).catch(error => {
					done();	
				});
			});

			it('should check for invalid/missing bundleId', function(done) {
				apns.push('abcd', 'qwe123', 'naksdk').then(() => {
					done(new Error('Check for missing bundleId failed'));	
				}).catch(error => {
					done();	
				});
			});
		});

		context('Graceful handling of request errors', function() {
			it('should handle 403 errors', function(done) {
				this.timeout(10000);
				const payload = {
					"aps" : {
						"badge" : 9,
						"sound" : "bingbong.aiff"
					},
					"messageID" : "ABCDEFGHIJ"
				}
				apns.push(payload, 'token', devicetoken, {topic: "com.patch.NotificationReceiverPatch"}).then(res => {
					done(new Error('Failed to handle the 403 error'));
				}).catch(error => {
					done();
				});
			});
		});

		context('Successful Requests', function() {
			it('should resolve successfully', function(done) {
				this.timeout(10000);
				const payload = {
					"aps" : {
						"badge" : 9,
						"sound" : "bingbong.aiff"
					},
					"messageID" : "ABCDEFGHIJ"
				}
				apns.push(payload, token, devicetoken, bundleid).then(res => {
					done();
				}).catch(done);
			});

			it('should use the given options', function(done) {
				this.timeout(10000);
				const payload = {
					"aps" : {
						"badge" : 9,
						"sound" : "bingbong.aiff"
					},
					"messageID" : "ABCDEFGHIJ"
				};
				const options = {
					id: uuid5(bundleid + Date.now()),
					expiration: 30,
					priority: 5,
					collapseId: `${Math.ceil(Math.random() * 10000)}`
				};
				apns.push(payload, token, devicetoken, bundleid, options).then(res => {
					done();
				}).catch(done);
			});
		});
	});
});