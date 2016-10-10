/**
 * List of all the GUI tests to run.
 *
 * @type {string[]}
 */
const tests = [
	'main'
];

tests.forEach( testName => {
	require( `tests/${testName}` );
} );