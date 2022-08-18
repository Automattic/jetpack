describe( 'Extra context', () => {
	const runAttempt = '3';
	const refType = 'branch';
	const refName = 'some-branch';
	const repository = 'foo/bar';
	const triggeringActor = 'octocat';

	process.env.GITHUB_RUN_ATTEMPT = runAttempt;
	process.env.GITHUB_REF_TYPE = refType;
	process.env.GITHUB_REF_NAME = refName;
	process.env.GITHUB_REPOSITORY = repository;
	process.env.GITHUB_TRIGGERING_ACTOR = triggeringActor;

	test( 'Environment variables are exposed in extra context', async () => {
		const extras = require( '../src/extra-context' );

		expect( extras.runAttempt ).toBe( runAttempt );
		expect( extras.refType ).toBe( refType );
		expect( extras.refName ).toBe( refName );
		expect( extras.repository ).toBe( repository );
		expect( extras.triggeringActor ).toBe( triggeringActor );
	} );
} );
