import { fileURLToPath } from 'node:url';
import { makeE2eConfig } from '@automattic/_jetpack-e2e-commons/eslint.config.mjs';

export default [
	...makeE2eConfig( import.meta.url ),
	{
		files: [ 'lib/fixtures/history-tooltip*', 'lib/fixtures/settings-tooltip*' ],
		rules: {
			// The browser fixtures bundle the plugin using its declared build dependencies.
			'import/no-extraneous-dependencies': [
				'error',
				{ packageDir: fileURLToPath( new URL( '../../', import.meta.url ) ) },
			],
		},
	},
	{
		files: [ 'lib/fixtures/settings-tooltip*' ],
		rules: {
			// This fixture reaches plugin sources through the `$…` aliases its webpack config
			// resolves, and loads its globals and stylesheets in a deliberate order.
			'import/no-unresolved': [ 'error', { ignore: [ '^\\$' ] } ],
			'import/order': 'off',
		},
	},
];
