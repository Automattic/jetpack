import { mockContextExtras } from './test-utils.js';

describe( 'Extra context', () => {
	const runAttempt = '3';
	const refType = 'branch';
	const refName = 'some-branch';
	const repository = 'foo/bar';
	const triggeringActor = 'octocat';

	mockContextExtras( { repository, refType, refName, triggeringActor, runAttempt } );

	test( 'Environment variables are exposed in extra context', async () => {
		const { default: extras } = await import( '../src/extra-context.js' );

		expect( extras.runAttempt ).toBe( runAttempt );
		expect( extras.refType ).toBe( refType );
		expect( extras.refName ).toBe( refName );
		expect( extras.repository ).toBe( repository );
		expect( extras.triggeringActor ).toBe( triggeringActor );
	} );
} );
