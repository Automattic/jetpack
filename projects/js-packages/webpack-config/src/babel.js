const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = ! isProduction;

const preset = require( './babel-preset.js' );

// Note: For this cjs module to be used with named exports in an mjs context, modules.exports
// needs to contain only simple variables like `a` or `a: b`. Define anything more complex
// as a variable above, then use the variable here.
// @see https://github.com/nodejs/node/blob/master/deps/cjs-module-lexer/README.md#exports-object-assignment
module.exports = {
	isProduction,
	isDevelopment,
	preset,
};
