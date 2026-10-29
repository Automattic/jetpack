/* global __EXPECTED_TIME_ZONE__ */

// Runs whatever environment the suite ends up in, so an `@jest-environment` docblock that drops
// the zone fails here instead of passing as one more UTC run.
const actual = Intl.DateTimeFormat().resolvedOptions().timeZone;
if ( actual !== __EXPECTED_TIME_ZONE__ ) {
	throw new Error(
		`The ${ __EXPECTED_TIME_ZONE__ } timezone pass ran in ${ actual }; check the suite for an @jest-environment docblock.`
	);
}
