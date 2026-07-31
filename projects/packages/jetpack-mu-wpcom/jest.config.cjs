const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	testMatch: [
		'<rootDir>/src/features/newsletter-mode/**/*.test.[jt]s?(x)',
		'<rootDir>/routes/newsletter-mode-*/**/*.test.[jt]s?(x)',
	],
};
