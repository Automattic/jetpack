import { defineConfig, makeBaseConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig(
	makeBaseConfig( import.meta.url ),
	{
		// Block-editor sources follow the same conventions as the Jetpack
		// plugin's `extensions/` directory: inline JSX handlers are common, and
		// functional React components don't carry JSDoc.
		files: [ 'src/blocks/**/*.{js,jsx,ts,tsx,mjs,cjs}' ],
		rules: {
			'react/jsx-no-bind': 'off',
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
		},
	},
	{
		// Vanilla-JS admin pages ship without a bundler; JSDoc and sprintf
		// static-analysis rules don't apply to these files.
		files: [ 'src/admin-pages/**/*.js' ],
		rules: {
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-description': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			'jsdoc/require-returns': 'off',
			'@wordpress/valid-sprintf': 'off',
		},
	}
);
