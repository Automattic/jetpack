const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	testMatch: [
		'<rootDir>/_inc/client/test/main.js',
		'<rootDir>/_inc/client/**/test/component.js',
		'<rootDir>/_inc/client/ai/features/test/component.jsx',
		'<rootDir>/_inc/client/sharing/test/component.jsx',
	],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	coverageDirectory: baseConfig.coverageDirectory + '/gui',
	// This is necessary to allow css from uplot, @wordpress/admin-ui, and @gravatar-com (the
	// latter for the lifted Gravatar component's hovercard styles) to be imported, and
	// @wordpress/theme's untranspiled ESM to be transformed (mirroring the base config —
	// this override otherwise shadows the base pattern's exception).
	transformIgnorePatterns: [
		'/node_modules/(?!.*/node_modules/)(?!@automattic/|uuid/|@wordpress/theme/|uplot/.*\\.css|@wordpress/admin-ui/.*\\.css|@gravatar-com/.*\\.css)',
		...baseConfig.transformIgnorePatterns,
	],
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/3rd-party/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/views/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
