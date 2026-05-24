const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	testMatch: [ '<rootDir>/_inc/client/test/main.js', '<rootDir>/_inc/client/**/test/component.js' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	coverageDirectory: baseConfig.coverageDirectory + '/gui',
	// This is necessary to allow css from uplot, @wordpress/admin-ui, and @gravatar-com (the
	// latter for the lifted Gravatar component's hovercard styles) to be imported.
	transformIgnorePatterns: [
		'/node_modules/(?!(.pnpm|@automattic)/|uuid/|uplot/.*\\.css|@wordpress/admin-ui/.*\\.css|@gravatar-com/.*\\.css)',
		...baseConfig.transformIgnorePatterns,
	],
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/3rd-party/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/views/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
