const config = require( 'jetpack-e2e-commons/config/playwright.config.default.cjs' );

config.globalSetup = './lib/setupTests.js';

module.exports = config;
