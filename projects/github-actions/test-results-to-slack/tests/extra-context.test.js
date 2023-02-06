const { mockContextExtras } = require( './test-utils' );

describe( 'Extra context', () => {
	const runAttempt = '3';
	const refType = 'branch';
	const refName = 'some-branch';
	const repository = 'foo/bar';
	const triggeringActor = 'octocat';

	mockContextExtras( { repository, refType, refName, triggeringActor, runAttempt } );

	test( 'Environment variables are exposed in extra context', async () => {
		const extras = require( '../src/extra-context' );

		expect( extras.runAttempt ).toBe( runAttempt );
		expect( extras.refType ).toBe( refType );
		expect( extras.refName ).toBe( refName );
		expect( extras.repository ).toBe( repository );
		expect( extras.triggeringActor ).toBe( triggeringActor );
	} );
} );
