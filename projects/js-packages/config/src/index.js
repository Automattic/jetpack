/* eslint-disable no-console */

let jetpackConfig = {};
try {
	// Using require allows us to catch the error and provide guidance to developers, as well as test the package.
	jetpackConfig = require( 'jetpackConfig' );
} catch {
	if ( globalThis.jetpackConfig ) {
		// Bundlers without webpack externals, such as `@wordpress/build`, provide it as a global.
		jetpackConfig = globalThis.jetpackConfig;
	} else {
		console.error(
			'jetpackConfig is missing in your webpack config file. See @automattic/jetpack-config'
		);
		jetpackConfig = { missingConfig: true };
	}
}

const jetpackConfigHas = key => {
	return Object.hasOwn( jetpackConfig, key );
};

const jetpackConfigGet = key => {
	if ( ! jetpackConfigHas( key ) ) {
		throw (
			'This app requires the "' +
			key +
			'" Jetpack Config to be defined in your webpack configuration file. See details in @automattic/jetpack-config package docs.'
		);
	}
	return jetpackConfig[ key ];
};

// Note: For this cjs module to be used with named exports in an mjs context, modules.exports
// needs to contain only simple variables like `a` or `a: b`. Define anything more complex
// as a variable above, then use the variable here.
// @see https://github.com/nodejs/node/blob/master/deps/cjs-module-lexer/README.md#exports-object-assignment
module.exports = {
	jetpackConfigHas,
	jetpackConfigGet,
};
