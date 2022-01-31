// Do not extend this file anymore! Extend .eslintrc.normal.js instead.
const loadIgnorePatterns = require( './tools/js-tools/load-eslint-ignore.js' );

module.exports = {
	extends: [ './.eslintrc.normal.js' ],
	ignorePatterns: loadIgnorePatterns( __dirname ),
};
