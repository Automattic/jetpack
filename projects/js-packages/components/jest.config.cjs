const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	setupFilesAfterEnv: [
		...baseConfig.setupFilesAfterEnv,
		require.resolve( 'jetpack-js-tools/jest/is-plain-obj-hack.js' ),
	],
};
