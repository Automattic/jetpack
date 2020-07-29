module.exports = () => ( {
	plugins: {
		'postcss-custom-properties': {
			importFrom: [ require.resolve( '@automattic/color-studio' ) ],
			// @TODO: Drop `preserve: false` workaround if possible
			// See https://github.com/Automattic/jetpack/pull/13854#issuecomment-550898168
			preserve: false,
		},
		autoprefixer: {},
	},
} );
