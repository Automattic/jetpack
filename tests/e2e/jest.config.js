/**
 * External dependencies
 */
const { jestConfig, jestPuppeteerConfig } = require( 'puppeteer-utils' );
let jestConfigMod = jestConfig;
let setupFiles = jestConfig.setupFiles;

setupFiles.push( './lib/setup.js' );
jestConfigMod.setupFiles = setupFiles;
jestPuppeteerConfig.useJestPuppeteerConfig();
module.exports = jestConfig;
