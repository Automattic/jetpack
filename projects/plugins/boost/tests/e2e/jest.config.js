const jetpackTestsRootDir = 'node_modules/jetpack-e2e-tests';
const sharedConfig = require( `./${ jetpackTestsRootDir }/jest.config` );

let sharedConfigAsString = JSON.stringify( sharedConfig );
sharedConfigAsString = sharedConfigAsString.replace(
	/<rootDir>/g,
	`<rootDir>/${ jetpackTestsRootDir }`
);
sharedConfigAsString = sharedConfigAsString.replace( /Jetpack/g, 'Jetpack Boost' );

const finalSharedConfig = JSON.parse( sharedConfigAsString );
finalSharedConfig.setupFilesAfterEnv.push( 'expect-playwright' );
finalSharedConfig.setupFilesAfterEnv.push( '<rootDir>/lib/setupTests.js' );

module.exports = {
	...finalSharedConfig,
};
