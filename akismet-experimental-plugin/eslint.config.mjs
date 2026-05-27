// Local eslint config for the akismet-experimental-plugin exploration.
// This directory is not a monorepo package; we override the bogus default
// textdomain from the monorepo's base config with our own.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

export default defineConfig( makeBaseConfig( import.meta.url, { textdomain: 'akismet' } ), {
	// Resolve the `@/*` import alias via tsconfig paths.
	settings: {
		'import/resolver': {
			typescript: {
				project: path.join( __dirname, 'tsconfig.json' ),
			},
		},
	},
} );
