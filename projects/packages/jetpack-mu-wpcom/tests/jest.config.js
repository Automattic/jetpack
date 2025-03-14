const path = require( 'path' );
const baseConfig = require( '../../../../tools/js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	rootDir: path.join( __dirname, '..' ),
	/**
	 * Allow only __tests__ folders since existing JS tests in tests/ are for playwright tests.
	 */
	testMatch: [ '<rootDir>/**/__tests__/**/*.[jt]s?(x)' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest.setup.js' ],
};
