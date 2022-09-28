const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/state/', '<rootDir>/_inc/client/lib/', '<rootDir>/modules/' ],
	coverageDirectory: 'coverage/client',
};
