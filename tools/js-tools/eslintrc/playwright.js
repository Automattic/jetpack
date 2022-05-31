/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	extends: [ './preload', 'plugin:playwright/playwright-test' ],
};
