import makeBaseConfig from 'jetpack-js-tools/eslintrc/base.mjs';

export default [
	...makeBaseConfig( import.meta.url ),
	{
		rules: {
			'react/jsx-no-bind': 'off',

			// Don't require JSDoc on functions.
			// Jetpack Extensions are often self-explanatory functional React components.
			'jsdoc/require-jsdoc': 'off',
		},
	},
];
