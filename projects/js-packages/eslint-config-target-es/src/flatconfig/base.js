const esx = require( 'eslint-plugin-es-x' );

const flatBase = {
	plugins: {
		'es-x': esx,
	},
	languageOptions: {
		ecmaVersion: 2022,
	},
};

try {
	const globals = require( 'globals' );
	if ( globals?.es2022 ) {
		flatBase.languageOptions.globals = globals.es2022;
	}
} catch ( e ) {
	// `globals` is optional.
}

module.exports = flatBase;
