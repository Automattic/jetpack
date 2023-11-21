import config from 'jetpack-e2e-commons/config/playwright.config.default.mjs';

config.globalSetup = './lib/setupTests.js';

export default {
	...config,
	actionTimeout: 40000,
};
