// React eslint config.

import wordpressEslintPlugin from '@wordpress/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, javascriptFiles } from './base.mjs';

/**
 * Generate the base eslint config.
 *
 * @param {string} configurl - File URL for the eslint.config.mjs. Pass `import.meta.url`.
 * @return {object[]} Eslint config.
 */
// eslint-disable-next-line no-unused-vars -- Better to keep it, even if unused right now.
export default function makeReactConfig( configurl ) {
	return defineConfig(
		{
			files: javascriptFiles,
			extends: [ wordpressEslintPlugin.configs.react ],
		},
		{
			name: 'Prettier react rule disables',
			files: javascriptFiles,
			rules: Object.fromEntries(
				Object.entries( eslintConfigPrettier.rules ).filter(
					( [ k, v ] ) => k.startsWith( 'react' ) && ( v === 0 || v === 'off' )
				)
			),
		},
		{
			name: 'Monorepo react config',
			files: javascriptFiles,
			settings: {
				react: {
					version: 'detect', // React version. "detect" automatically picks the version you have installed.
				},
			},
			rules: {
				'react/jsx-no-bind': [ 'error', { ignoreRefs: true } ],
				'react/no-danger': 'error',
				'react/no-did-mount-set-state': 'error',
				'react/no-did-update-set-state': 'error',
				'react/prefer-es6-class': 'warn',
			},
		}
	);
}
