import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';

const __dirname = import.meta.dirname;

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
				plugins: [
					storybookTest( {
						configDir: `${ __dirname }/storybook`,
						tags: {
							skip: [ 'no-vitest' ],
						},
					} ),
				],
				test: {
					name: 'storybook',
					testTimeout: 30000, // Apparently there's no way to do a per-story timeout, have to set it globally.
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
