const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/state/' ],
	coverageDirectory: 'coverage/client',
};
