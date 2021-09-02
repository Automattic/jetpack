const jetpackTestsRootDir = 'node_modules/jetpack-e2e-tests';
const sharedConfig = require( `./${ jetpackTestsRootDir }/babel.config.js` );

module.exports = {
	...sharedConfig,
};
