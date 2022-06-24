const baseConfig = require( 'jetpack-js-tools/jest/config.base.js' );

module.exports = {
	...baseConfig,
	extensionsToTreatAsEsm: [ '.jsx', '.ts', '.tsx' ],
};
