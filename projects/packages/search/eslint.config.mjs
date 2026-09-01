import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url ), {
	rules: {
		'react/jsx-no-bind': 'off',
	},
	settings: {
		// `jetpack-search/store` is a WordPress Script Module the blocks build
		// externalizes (see tools/webpack.blocks.config.js); it has no resolvable
		// path on disk, so treat it as an external module for import/no-unresolved.
		'import/core-modules': [ 'jetpack-search/store' ],
	},
} );
