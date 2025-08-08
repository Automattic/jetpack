import { makeE2eConfig } from '_jetpack-e2e-commons/eslint.config.mjs';
import { defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( ...makeE2eConfig( import.meta.url ), {
	settings: {
		'import/resolver': {
			typescript: {
				project: 'projects/plugins/boost/tests/e2e/tsconfig.json',
			},
		},
	},
} );
