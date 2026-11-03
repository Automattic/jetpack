// Temporary: fails on a workflow's first attempt only, to test the coverage status after "Re-run failed jobs". Do not merge.
test( 'fails only on the first run attempt', () => {
	expect( process.env.GITHUB_RUN_ATTEMPT ).not.toBe( '1' );
} );
