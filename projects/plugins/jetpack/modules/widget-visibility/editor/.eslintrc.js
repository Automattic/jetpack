// eslint-disable-next-line import/no-extraneous-dependencies
const loadIgnorePatterns = require( 'jetpack-js-tools/load-eslint-ignore.js' );

module.exports = {
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended-with-formatting',
		'../../../.eslintrc.js',
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
};
