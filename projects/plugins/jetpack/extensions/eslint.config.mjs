import makeBaseConfig, { makeEnvConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	makeEnvConfig( 'node', [ 'blocks/like/tools/**' ] ),
	{
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
			'react/jsx-no-bind': 'off',

			// Don't require JSDoc on functions.
			// Jetpack Extensions are often self-explanatory functional React components.
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-property-description': 'off',
			'jsdoc/require-param-description': 'off',
		},
	},
];
