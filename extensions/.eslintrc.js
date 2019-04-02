module.exports = {
	extends: [ 'plugin:jest/recommended' ],
	plugins: [ 'jsx-a11y', 'jest' ],
	env: {
		'jest/globals': false,
	},
	overrides: [
		{
			files: [ '**/test/*.js' ],
			env: {
				'jest/globals': true,
			},
		},
	],
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
	},
};
