/**
 * External dependencies
 */
require = require( 'esm' )( module );
const { jestConfig, jestPuppeteerConfig } = require( 'puppeteer-utils' );
const jestConfigMod = jestConfig;
const setupFiles = jestConfig.setupFiles;

setupFiles.push( './lib/setup.js' );
jestConfigMod.setupFiles = setupFiles;
jestPuppeteerConfig.useJestPuppeteerConfig();
module.exports = jestConfigMod;
