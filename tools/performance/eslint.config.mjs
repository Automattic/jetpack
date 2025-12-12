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
			// JSDoc is nice but not required for these utility scripts
			'jsdoc/require-jsdoc': 'off',
			'jsdoc/require-param': 'off',
			'jsdoc/require-returns': 'off',
			'jsdoc/require-param-description': 'off',
			'jsdoc/require-param-type': 'off',
			// Dependencies are in tools/performance/package.json, not monorepo root
			// so the import resolver can't find them. Disable this rule.
			'import/no-unresolved': 'off',
		},
	},
] );
