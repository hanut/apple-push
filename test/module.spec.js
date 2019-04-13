const expect = require('chai').expect;
const ApplePush = require('../index')

const teamid = process.env.teamid || throw new Error('teamid not set in env');
const keyid = process.env.keyid || throw new Error('keyid not set in env');
const key = process.env.key || throw new Error('key not set in env');


describe('Test Suit for apple-push module', function() {

	it('should return a class', function() {
		console.log(ApplePush);
	})


});