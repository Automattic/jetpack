const { MockAgent, setGlobalDispatcher } = require( 'undici' );
const { mockContextExtras } = require( './test-utils' );

describe( 'Workflow conclusion', () => {
	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'Workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'Workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'Workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ true }  | ${ 'Workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		const { mockGitHubContext } = require( './test-utils' );
		const runId = '12345';
		const repository = 'foo/bar';

		// Mock GitHub context
		mockGitHubContext( { runId } );
		mockContextExtras( { repository } );

		// Intercept request to GitHub Api and mock response
		const mockAgent = new MockAgent();
		setGlobalDispatcher( mockAgent );
		mockAgent
			.get( 'https://api.github.com' )
			.intercept( { path: `/repos/${ repository }/actions/runs/${ runId }/jobs` } )
			.reply( 200, { jobs }, { headers: { 'content-type': 'application/json' } } );

		const { isWorkflowFailed } = require( '../src/github' );
		const conclusion = await isWorkflowFailed( 'token' );
		await expect( conclusion ).toBe( expected );
	} );
} );
