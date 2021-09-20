const basePlaywrightConfig = require( 'jetpack-e2e-core/config/playwright.config.default' );

basePlaywrightConfig.pwBrowserOptions.timeout = 21000;

module.exports = basePlaywrightConfig;
