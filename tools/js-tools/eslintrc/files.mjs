// Lists of different types of files.

/**
 * File patterns for files treated as some variety of JavaScript.
 */
export const javascriptFiles = [
	'**/*.js',
	'**/*.jsx',
	'**/*.cjs',
	'**/*.mjs',
	'**/*.ts',
	'**/*.tsx',
	'**/*.cts',
	'**/*.mts',
	'**/*.svelte',
];

/**
 * File patterns for files treated as JSON.
 */
export const jsonFiles = [ '**/*.json', '**/*.jsonc', '**/*.json5' ];

/**
 * File patterns for files treated as TypeScript.
 */
export const typescriptFiles = [ '**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts' ];

/**
 * File patterns for files treated as Jest.
 */
export const jestFiles = [
	'**/jest-globals.?([mc])js',
	'**/jest.setup.?([mc])js',
	// Note: Keep the patterns here in sync with tools/js-tools/jest/config.base.js.
	'**/__tests__/**/*.[jt]s?(x)',
	'**/?(*.)+(spec|test).[jt]s?(x)',
	'**/test/*.[jt]s?(x)',
	// Other files under /test/ probably need jest rules too.
	'**/test?(s)/**/*.[jt]s?(x)',
];
