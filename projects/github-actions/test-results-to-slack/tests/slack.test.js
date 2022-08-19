const { WebClient } = require( '@slack/web-api' );
const { setInputData } = require( './test-utils' );

const slackChannel = '1234ABCD';
const slackUsername = 'Test Reporter';

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

beforeAll( () => {
	setInputData( { slackChannel, slackUsername } );
} );

describe.skip( 'Notification is sent', () => {
	const client = new WebClient();

	test( `Correct message is sent to Slack`, async () => {
		// Mock workflow conclusion
		const gh = require( '../src/github' );
		jest.spyOn( gh, 'isWorkflowFailed' ).mockImplementation().mockReturnValueOnce( true );

		// Mock existing message
		const slack = require( '../src/slack' );
		jest.spyOn( slack, 'getMessage' ).mockImplementation().mockReturnValueOnce( undefined );

		// Mock notification text
		const expectedData = { text: 'This is the message text', id: 'expected-id' };
		jest
			.spyOn( gh, 'getNotificationData' )
			.mockImplementation()
			.mockReturnValueOnce( expectedData );

		// Run the action
		const action = await require( '../src/index' );
		await action;

		// Expect that Slack client gets called with the right arguments
		await expect( client.chat.postMessage ).toHaveBeenCalledWith(
			expect.objectContaining( {
				text: expectedData.text,
				channel: slackChannel,
				username: slackUsername,
				icon_emoji: ':red_circle:',
			} )
		);
	} );
} );
