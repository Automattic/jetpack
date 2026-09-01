// eslint config in _inc/eslint.config.mjs is screwy for historical reasons that don't apply to built modules like this one.
// Reset to match Jetpack's root dir.
import { makeBaseConfig, defineConfig, javascriptFiles } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	files: javascriptFiles,
	rules: {
		'jsdoc/check-tag-names': [ 'error', { definedTags: [ 'ssr-ready' ] } ],
	},
} );
