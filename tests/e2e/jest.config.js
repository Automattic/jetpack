/**
 * External dependencies
 */
const { jestConfig, useJestPuppeteerConfig } = require( 'puppeteer-utils' );
const jestConfigMod = jestConfig;

jestConfigMod.setupFiles = [ './lib/setup.js' ];
useJestPuppeteerConfig();
module.exports = jestConfigMod;
