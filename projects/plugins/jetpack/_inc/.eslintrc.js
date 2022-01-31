/* eslint-env node */
const loadIgnorePatterns = require( '../../../../tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	// Use ESlint from modules folder. JS files here are not transpiled unless otherwise configured.
	root: true,
	extends: [ '../modules/.eslintrc.js' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
};
