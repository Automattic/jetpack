/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
	// eslint config in modules/.eslintrc.js is screwy for historical reasons that don't apply to tests.
	// Reset to the rules from Jetpack's root dir.
	extends: [ '../../../../.eslintrc.js' ],
};
