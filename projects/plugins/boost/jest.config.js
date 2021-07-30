module.exports = {
	preset: 'jest-puppeteer',
	// globals: {
	// 	URL: 'http://localhost:8090',
	// },
	testMatch: [ '**/tests/integration/*.test.js' ],
	verbose: true,
	setupFiles: [ './tests/integration/reset-wp' ],
	testTimeout: 60000,
};
