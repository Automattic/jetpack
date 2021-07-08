// Needed to use transpiled generator functions.
// See: https://babeljs.io/docs/en/babel-polyfill for details.
require( 'regenerator-runtime/runtime' );
import semver from 'semver';

if ( ! window.matchMedia ) {
	window.matchMedia = query => ( {
		matches: false,
		media: query,
		onchange: null,
		addListener: jest.fn(), // deprecated
		removeListener: jest.fn(), // deprecated
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
		dispatchEvent: jest.fn(),
	} );
}

// Currently needed for testing jetpack blocks against new versions of Gutenberg.
if ( ! window.CSS ) {
	window.CSS = {
		escape: () => false,
		supports: () => false,
	};
}

// Some of the Jetpack block tests need to be run only against specific versions
// of Gutenberg dependencies, so this method only runs the passed in expectations
// if the current Gutenberg version matches.
window.runBackwardsCompatExpections = testCases => {
	// global.gutenbergVersion is only set when running the jetpack block tests against
	// different gutenberg versions with `pnpm fixtures:test:gbv`. In other instances
	// set it a default of 10.8.0, which is one less than when this method was introduced
	const currentVersion = global.gutenbergVersion ? global.gutenbergVersion : '10.8.0';

	testCases.forEach( testCase => {
		if ( semver.satisfies( currentVersion, testCase.gutenbergVersion ) ) {
			testCase.expectation();
			return;
		}
	} );
};
