// Fairly standard set of inclusions.
module.exports = {
	coverageDirectory: process.env.COVERAGE_DIR ?? '/',
	coverageReporters: [ 'json' ],
	collectCoverageFrom: [
		// If you have directories other than src/ with JS files, repeat this as appropriate.
		'<rootDir>/src/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/index.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/*.d.ts',

		// Exclude test files. Keep the patterns here in sync with testMatch in ./config.node.js and tools/js-tools/eslintrc/files.mjs.
		'!<rootDir>/**/__tests__/**/*.[jt]s?(x)',
		'!<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
		'!<rootDir>/**/test/*.[jt]s?(x)',

		// Exclude storybook stories too.
		'!<rootDir>/**/stories/*.[jt]s?(x)',
	],
};
