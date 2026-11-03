import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import makeReactConfig from 'jetpack-js-tools/eslintrc/react.mjs';

// The form is Preact; only the block editor is React. React's rules, such as its camelCase
// SVG attributes, would misread the Preact code.
export default defineConfig( makeBaseConfig( import.meta.url, { react: false } ), {
	files: [ 'src/editor/**' ],
	extends: [ makeReactConfig( import.meta.url ) ],
	// The editor speaks core's strings, translated by core's language packs under the default domain.
	rules: { '@wordpress/i18n-text-domain': 'off' },
} );
