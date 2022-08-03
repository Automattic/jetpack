const path = require( 'path' );
const { WebClient } = require( '@slack/web-api' );

const channel = '123abc';
const username = 'Test reporter';
const emoji = 'Test reporter';

process.env.INPUT_GITHUB_TOKEN = 'token';
process.env.INPUT_SLACK_TOKEN = 'token';
process.env.INPUT_SLACK_CHANNEL = channel;
process.env.INPUT_SLACK_USERNAME = username;
process.env.INPUT_SLACK_ICON_EMOJI = emoji;

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

describe( 'Test notifications', () => {
	const client = new WebClient();

	test( 'failed tests on push event', async () => {
		process.env.GITHUB_EVENT_PATH = path.join( __dirname, 'payload-push.json' );
		process.env.GITHUB_EVENT_NAME = 'push';
		const testSHA = '12345abcd';
		process.env.GITHUB_SHA = testSHA;
		process.env.GITHUB_REF = 'refs/heads/trunk';
		const expectedText = `Tests failed for commit \`${ testSHA }\` on branch \`trunk\` https://github.com/foo/bar/commit/2533d1ea61d89d418bdb617608848f1e52d6fc9c`;

		require( '../src/index' );
		await expect( client.chat.postMessage ).resolves.toHaveBeenCalledWith(
			expect.objectContaining( { text: expectedText, channel, username, icon_emoji: emoji } )
		);
	} );
} );
