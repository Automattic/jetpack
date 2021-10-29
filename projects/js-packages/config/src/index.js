/* eslint-disable no-console */

let jetpackConfig = {};
try {
	// Using require allows us to catch the error and provide guidance to developers, as well as test the package.
	jetpackConfig = require( 'jetpackConfig' );
} catch {
	console.error(
		'jetpackConfig is missing in your webpack config file. See @automattic/jetpack-config'
	);
	jetpackConfig = { missingConfig: true };
}

export const jetpackConfigHas = key => {
	return jetpackConfig.hasOwnProperty( key );
};

export const jetpackConfigGet = key => {
	if ( ! jetpackConfigHas( key ) ) {
		throw (
			'This app requires the "' +
			key +
			'" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.'
		);
	}
	return jetpackConfig[ key ];
};
