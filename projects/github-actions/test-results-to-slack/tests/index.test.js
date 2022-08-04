const github = require( '@actions/github' );
const nock = require( 'nock' );

const channel = '123abc';
const username = 'Test reporter';
const emoji = 'Test reporter';
const testSHA = '12345abcd';
const runId = '12345';
const branch = 'trunk';
const repo = 'foo/bar';
const ghToken = 'token';
const repository = { owner: { login: 'foo' }, name: 'bar' };

process.env.INPUT_GITHUB_TOKEN = ghToken;
process.env.INPUT_SLACK_TOKEN = 'token';
process.env.INPUT_SLACK_CHANNEL = channel;
process.env.INPUT_SLACK_USERNAME = username;
process.env.INPUT_SLACK_ICON_EMOJI = emoji;
process.env.GITHUB_REPOSITORY = repo;

const defaultGitHubContext = { ...github.context };
afterEach( () => {
	// Reset GitHub context to default
	mockGitHubContext( defaultGitHubContext );
} );

describe( 'Notification text', () => {
	const commitURL = 'https://github.com/commit/123';
	const commitId = '123';

	test.each`
		event       | isFailure  | expected
		${ 'push' } | ${ false } | ${ `Tests passed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'push' } | ${ true }  | ${ `Tests failed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
	`( `$isFailure for $event`, async ( { event, isFailure, expected } ) => {
		// Mock GitHub context
		mockGitHubContext( {
			payload: { head_commit: { url: commitURL, id: 123 } },
			ref: `refs/heads/${ branch }`,
			sha: testSHA,
			eventName: event,
		} );

		// Mock workflow conclusion
		const utils = require( '../src/utils' );
		jest.spyOn( utils, 'isWorkflowFailed' ).mockImplementation().mockReturnValueOnce( isFailure );

		await await expect( utils.getNotificationText( isFailure ) ).resolves.toBe( expected );
	} );
} );

describe( 'Workflow conclusion', () => {
	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ true }  | ${ 'workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		// Mock GitHub context
		mockGitHubContext( { payload: { repository }, runId } );

		// Intercept request to GitHub Api and mock response
		nock( 'https://api.github.com' )
			.get( `/repos/${ repo }/actions/runs/${ runId }/jobs` )
			.reply( 200, {
				jobs,
			} );

		const utils = require( '../src/utils' );
		await await expect( utils.isWorkflowFailed( ghToken ) ).resolves.toBe( expected );
	} );
} );

/**
 * Mocks the GitHub context
 *
 * @param {object} value - context object
 */
function mockGitHubContext( value ) {
	Object.defineProperty( github, 'context', {
		value,
	} );
}
