const path = require( 'path' );
const { WebClient } = require( '@slack/web-api' );
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

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

describe( 'Workflow conclusion', () => {
	test.each`
		expected   | description                                                   | jobs
		${ false } | ${ 'workflow is successful for empty jobs list' }             | ${ [] }
		${ false } | ${ 'workflow is successful for 2 successful completed jobs' } | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'success' } ] }
		${ false } | ${ 'workflow is successful for 2 uncompleted jobs' }          | ${ [ { conclusion: 'failed' }, { status: 'should-not-matter', conclusion: 'failed' } ] }
		${ true }  | ${ 'workflow is failed for one failed job' }                  | ${ [ { status: 'completed', conclusion: 'success' }, { status: 'completed', conclusion: 'failed' } ] }
	`( '$description', async ( { expected, jobs } ) => {
		process.env.GITHUB_EVENT_PATH = path.join( __dirname, 'payload-push.json' );
		nock( 'https://api.github.com' )
			.get( `/repos/${ repo }/actions/runs/${ runId }/jobs` )
			.reply( 200, {
				jobs,
			} );

		const utils = require( '../src/utils' );

		await expect( utils.isWorkflowFailed( ghToken ) ).resolves.toBe( expected );
	} );
} );

describe( 'Notification text', () => {
	test.each`
		description    | isFailure  | event       | expected
		${ 'failure' } | ${ false } | ${ 'push' } | ${ `Tests commit <'https://github.com/foo/bar/commit/2533d1ea61d89d418bdb617608848f1e52d6fc9c'|${ testSHA }> on branch *${ branch }*` }
	`( '$description for $event', async ( { isFailure, event, expected } ) => {
		process.env.GITHUB_EVENT_NAME = 'push';
		process.env.GITHUB_EVENT_PATH = path.join( __dirname, `payload-${ event }.json` );

		const utils = require( '../src/utils' );
		jest.spyOn( utils, 'isWorkflowFailed' ).mockImplementation().mockReturnValueOnce( isFailure );

		await await expect( utils.getNotificationText( isFailure ) ).resolves.toBe( expected );
	} );
} );

describe( 'Notification is sent', () => {
	const client = new WebClient();

	test( 'failed tests on push event', async () => {
		process.env.GITHUB_EVENT_PATH = path.join( __dirname, 'payload-push.json' );
		process.env.GITHUB_EVENT_NAME = 'push';

		const utils = require( '../src/utils' );
		jest.spyOn( utils, 'isWorkflowFailed' ).mockImplementation().mockReturnValueOnce( true );

		const expectedText = `Tests failed for commit \`${ testSHA }\` on branch \`${ branch }\` https://github.com/${ repo }/commit/${ testSHA }`;

		require( '../src/index' );

		await await expect( client.chat.postMessage ).resolves.toHaveBeenCalledWith(
			expect.objectContaining( { text: expectedText, channel, username, icon_emoji: emoji } )
		);
	} );
} );
