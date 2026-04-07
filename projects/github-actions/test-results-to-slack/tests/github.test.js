import { MockAgent, setGlobalDispatcher } from 'undici';
import { mockGitHubContext, mockContextExtras } from './test-utils.js';

describe( 'Workflow conclusion', () => {
	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'Workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'Workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'Workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ false } | ${ 'Workflow is successful for skipped jobs' }                | ${ [ { status: 'completed', conclusion: 'skipped' }, { status: 'completed', conclusion: 'success' } ] }
		${ true }  | ${ 'Workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		const runId = '12345';
		const repository = 'foo/bar';

		// Mock GitHub context
		await mockGitHubContext( { runId } );
		mockContextExtras( { repository } );

		// Intercept request to GitHub Api and mock response
		const mockAgent = new MockAgent();
		setGlobalDispatcher( mockAgent );
		mockAgent
			.get( 'https://api.github.com' )
			.intercept( { path: `/repos/${ repository }/actions/runs/${ runId }/jobs` } )
			.reply( 200, { jobs }, { headers: { 'content-type': 'application/json' } } );

		const { isWorkflowFailed } = await import( '../src/github.js' );
		const conclusion = await isWorkflowFailed( 'token' );
		await expect( conclusion ).toBe( expected );
	} );
} );
