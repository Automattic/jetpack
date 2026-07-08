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
