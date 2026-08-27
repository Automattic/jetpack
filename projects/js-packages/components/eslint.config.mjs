import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

// The components package implements Jetpack UI primitives.
export default defineConfig( makeBaseConfig( import.meta.url ), {
	rules: {
		'@automattic/jetpack/use-recommended-jetpack-components': 'off',
	},
} );
