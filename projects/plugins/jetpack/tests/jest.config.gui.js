const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	testMatch: [ '<rootDir>/_inc/client/test/main.js', '<rootDir>/_inc/client/**/test/component.js' ],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	coverageDirectory: baseConfig.coverageDirectory + '/gui',
	// This is necessary to allow css from uplot and @wordpress/admin-ui to be imported.
	transformIgnorePatterns: [
		'/node_modules/(?!(.pnpm|@automattic)/|.*uplot.*\\.css|.*@wordpress/admin-ui/.*\\.css)',
		...baseConfig.transformIgnorePatterns,
	],
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/3rd-party/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/views/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
