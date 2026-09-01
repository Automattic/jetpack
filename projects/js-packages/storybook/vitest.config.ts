import { execSync } from 'child_process';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { searchForWorkspaceRoot } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const __dirname = import.meta.dirname;

/*
 * Under `enableGlobalVirtualStore`, packages resolve into the pnpm store rather than the monorepo,
 * and Vite refuses to serve files outside its allow list. Setting `allow` replaces the default, so
 * the workspace root has to be listed too.
 */
const pnpmStorePath = execSync( 'pnpm store path', { encoding: 'utf8' } ).trim();

export default defineConfig( {
	server: {
		watch: {
			// Vite doesn't like our vendor symlink loops.
			ignored: [ '**/vendor/**', '**/jetpack_vendor/**' ],
		},
	},
	test: {
		projects: [
			{
				server: {
					fs: {
						allow: [ searchForWorkspaceRoot( __dirname ), pnpmStorePath ],
					},
				},
				plugins: [
					await storybookTest( {
						configDir: `${ __dirname }/storybook`,
						tags: {
							skip: [ 'no-vitest' ],
						},
					} ),
				],
				test: {
					name: 'storybook',
					isolate: false, // https://github.com/storybookjs/storybook/pull/34004
					browser: {
						enabled: true,
						headless: true,
						instances: [ { browser: 'chromium' } ],
						provider: playwright(),
					},
					exclude: [ ...configDefaults.exclude, '**/vendor/**', '**/jetpack_vendor/**' ],
				},
			},
		],
	},
} );
