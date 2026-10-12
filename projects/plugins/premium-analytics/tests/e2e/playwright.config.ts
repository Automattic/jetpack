import baseConfig, {
	setupProjects,
} from '@automattic/_jetpack-e2e-commons/playwright.config.default';

const environmentCheck = setupProjects.filter( project => project.name === 'environment check' );

export default {
	...baseConfig,
	projects: [
		...environmentCheck,
		{
			name: 'local authentication',
			testDir: './setup',
			testMatch: 'auth.setup.ts',
			dependencies: [ 'environment check' ],
			storageState: undefined,
		},
		{
			name: 'premium analytics e2e',
			testMatch: '**/specs/**',
			dependencies: [ 'local authentication' ],
		},
	],
};
