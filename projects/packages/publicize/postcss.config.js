module.exports = () => ( {
	plugins: [
		require( '@csstools/postcss-global-data' )( {
			// Provide the properties that postcss-custom-properties is going to work with.
			files: [ require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ) ],
		} ),
		require( 'postcss-custom-properties' )( {
			// Use of `preserve: false` dates back to when we still used @automattic/calypso-build.
			// Ideally we'd get rid of it to properly make use of CSS vars, but first we have to
			// figure out how to ensure the vars actually get defined in the browser without
			// including them in every bundle. Some base stylesheet (wp_register_style) the other
			// stylesheets depend on maybe? And also deal with extremely generic vars like "--color-text".
			//
			// See also https://github.com/Automattic/jetpack/pull/13854#issuecomment-550898168,
			// where people were confused about what was going on when calypso-build stopped
			// including a postcss.config.js like this by default.
			preserve: false,
		} ),
		require( 'autoprefixer' ),
	],
} );
