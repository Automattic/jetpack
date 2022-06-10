const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	transform: {
		...baseConfig.transform,
	},
	extensionsToTreatAsEsm: [ '.jsx' ],
};

// Disable default esm transform.
delete module.exports.transform[ '\\.[jt]sx?$' ];
