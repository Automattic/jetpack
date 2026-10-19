import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import makeReactConfig from 'jetpack-js-tools/eslintrc/react.mjs';

// The form is Preact; only the block editor and the settings are React. React's rules, such as its
// camelCase SVG attributes, would misread the Preact code.
export default defineConfig(
	makeBaseConfig( import.meta.url, { react: false } ),
	{
		files: [ 'src/editor/**', 'src/settings/**' ],
		extends: [ makeReactConfig( import.meta.url ) ],
	},
	{
		files: [ 'src/editor/**' ],
		// The editor speaks core's strings, translated by core's language packs under the default domain.
		rules: { '@wordpress/i18n-text-domain': 'off' },
	}
);
