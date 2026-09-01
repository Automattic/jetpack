// Fairly standard set of inclusions.
module.exports = {
	coverageDirectory: process.env.COVERAGE_DIR ?? '/',
	coverageReporters: [ 'json' ],
	collectCoverageFrom: [
		// If you have directories other than src/ with JS files, repeat this as appropriate.
		'<rootDir>/src/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/index.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/*.d.ts',

		// wp-build uses random dirs in the project root, sigh.
		'<rootDir>/packages/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'!<rootDir>/packages/**/(build|build-module)/**', // and it dumps build files in the source dirs, double sigh.
		'<rootDir>/routes/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',
		'<rootDir>/widgets/**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}',

		// Exclude test files. Keep the patterns here in sync with testMatch in ./config.node.js and tools/js-tools/eslintrc/files.mjs.
		'!<rootDir>/**/__tests__/**/*.[jt]s?(x)',
		'!<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)',
		'!<rootDir>/**/test/*.[jt]s?(x)',

		// Exclude storybook stories too, including support files nested under
		// a stories dir (mocks, fixtures, decorators).
		'!<rootDir>/**/stories/**/*.[jt]s?(x)',
	],
};
