module.exports = {
	extends: [
		'../.eslintrc.js',
		'plugin:@wordpress/eslint-plugin/i18n',
		'plugin:jest/recommended',
	],
	env: { jest: true },
	rules: {
		'react/forbid-elements': [
			'error',
			{
				forbid: [
					[ 'circle', 'Circle' ],
					[ 'g', 'G' ],
					[ 'path', 'Path' ],
					[ 'polygon', 'Polygon' ],
					[ 'rect', 'Rect' ],
					[ 'svg', 'SVG' ],
				].map( ( [ element, componentName ] ) => ( {
					element,
					message: `use <${ componentName }> from @wordpress/components`,
				} ) ),
			},
		],
		'react/jsx-no-bind': 0,
		'react/react-in-jsx-scope': 0,
		'space-unary-ops': 0,
		'space-before-function-paren': 0,
		'wpcalypso/jsx-classname-namespace': 0,

		// eslint 6.x migration
		'react-hooks/rules-of-hooks': 1,
		'no-async-promise-executor': 1,

		// Don't require JSDoc on functions.
		// Jetpack Extensions are often self-explanatory functional React components.
		'jsdoc/require-jsdoc': 0,
		'jsdoc/check-tag-names': [
			1, // Recommended
			{ definedTags: [ 'jest-environment' ] },
		],
	},
};
