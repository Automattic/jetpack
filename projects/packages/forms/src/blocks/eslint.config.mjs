import { makeBaseConfig, defineConfig, javascriptFiles } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: javascriptFiles,
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
	},
} );
