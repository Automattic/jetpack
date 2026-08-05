const baseConfig = require( './jest.config.base.js' );

module.exports = {
	...baseConfig,
	roots: [ '<rootDir>/_inc/client/' ],
	// Curated rather than a glob: `**/test/*.js` would also pick up the many
	// `test/fixtures.js` files (which contain no tests) and re-run the
	// `_inc/client/state/` suites that jest.config.client.js already owns.
	testMatch: [
		'<rootDir>/_inc/client/test/main.js',
		'<rootDir>/_inc/client/**/test/component.js',
		'<rootDir>/_inc/client/sharing/test/component.jsx',
		'<rootDir>/_inc/client/at-a-glance/stats/test/chart-bar-range.js',
	],
	setupFilesAfterEnv: [ ...baseConfig.setupFilesAfterEnv, '<rootDir>/tests/jest-globals.gui.js' ],
	coverageDirectory: baseConfig.coverageDirectory + '/gui',
	// This is necessary to allow css from uplot, @wordpress/admin-ui, and @gravatar-com (the
	// latter for the lifted Gravatar component's hovercard styles) to be imported.
	transformIgnorePatterns: [
		'/node_modules/(?!.*/node_modules/)(?!@automattic/|uuid/|uplot/.*\\.css|@wordpress/admin-ui/.*\\.css|@gravatar-com/.*\\.css)',
		...baseConfig.transformIgnorePatterns,
	],
	collectCoverageFrom: [
		'<rootDir>/_inc/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/3rd-party/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/views/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		...baseConfig.collectCoverageFrom,
	],
};
