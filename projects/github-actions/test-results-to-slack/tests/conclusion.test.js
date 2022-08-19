const nock = require( 'nock' );
const { mockGitHubContext, setInputData } = require( './test-utils' );

const runId = '12345';
const repo = 'foo/bar';
const ghToken = 'token';
const repository = { owner: { login: 'foo' }, name: 'bar' };

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Workflow conclusion', () => {
	// Mock GitHub context
	mockGitHubContext( { payload: { repository }, runId } );

	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'Workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'Workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'Workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ true }  | ${ 'Workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		// Intercept request to GitHub Api and mock response
		nock( 'https://api.github.com' )
			.get( `/repos/${ repo }/actions/runs/${ runId }/jobs` )
			.reply( 200, {
				jobs,
			} );

		const { isWorkflowFailed } = require( '../src/github' );
		const conclusion = await isWorkflowFailed( ghToken );
		await expect( conclusion ).toBe( expected );
	} );
} );
