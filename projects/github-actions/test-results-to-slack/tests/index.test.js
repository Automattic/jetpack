const path = require( 'path' );
const nock = require( 'nock' );

const channel = '123abc';
const username = 'Test reporter';
const emoji = 'Test reporter';
const testSHA = '12345abcd';
const runId = '12345';
const branch = 'trunk';
const repo = 'foo/bar';
const ghToken = 'token';

process.env.INPUT_GITHUB_TOKEN = ghToken;
process.env.INPUT_SLACK_TOKEN = 'token';
process.env.INPUT_SLACK_CHANNEL = channel;
process.env.INPUT_SLACK_USERNAME = username;
process.env.INPUT_SLACK_ICON_EMOJI = emoji;
process.env.GITHUB_REPOSITORY = repo;
process.env.GITHUB_SHA = testSHA;
process.env.GITHUB_REF = `refs/heads/${ branch }`;
process.env.GITHUB_RUN_ID = runId;

describe( 'Workflow conclusion', () => {
	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ true }  | ${ 'workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		process.env.GITHUB_EVENT_PATH = path.join( __dirname, 'fixtures/payload-push.json' );
		nock( 'https://api.github.com' )
			.get( `/repos/${ repo }/actions/runs/${ runId }/jobs` )
			.reply( 200, {
				jobs,
			} );

		const utils = require( '../src/utils' );

		await expect( utils.isWorkflowFailed( ghToken ) ).resolves.toBe( expected );
	} );
} );
