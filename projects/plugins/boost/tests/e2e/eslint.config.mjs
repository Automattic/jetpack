import { fileURLToPath } from 'node:url';
import { makeE2eConfig } from '@automattic/_jetpack-e2e-commons/eslint.config.mjs';

export default [
	...makeE2eConfig( import.meta.url ),
	{
		files: [ 'lib/fixtures/history-tooltip*' ],
		rules: {
			// The browser fixture bundles the plugin using its declared build dependencies.
			'import/no-extraneous-dependencies': [
				'error',
				{ packageDir: fileURLToPath( new URL( '../../', import.meta.url ) ) },
			],
		},
	},
];
