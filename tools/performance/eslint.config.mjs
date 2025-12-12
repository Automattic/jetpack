/**
 * ESLint configuration for performance testing CLI scripts.
 * These are standalone Node.js scripts, not part of the WordPress plugin.
 */
import { makeBaseConfig, defineConfig } from 'jetpack-js-tools/eslintrc/base.mjs';

export default defineConfig( makeBaseConfig( import.meta.url, { envs: [ 'node' ] } ), [
	{
		rules: {
			// These are CLI scripts - console output is intentional
			'no-console': 'off',
			// CLI scripts need process.exit for proper exit codes
			'n/no-process-exit': 'off',
			// Minimal JSDoc for utility scripts - descriptions only
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
		},
	},
] );
