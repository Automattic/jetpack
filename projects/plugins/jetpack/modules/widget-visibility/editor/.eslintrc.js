const loadIgnorePatterns = require( '../../../../../../tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	extends: [
		'plugin:@wordpress/eslint-plugin/recommended-with-formatting',
		'../../../.eslintrc.js',
	],
	ignorePatterns: loadIgnorePatterns( __dirname ),
};
