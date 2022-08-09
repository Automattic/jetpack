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

describe( 'Notification is sent', () => {
	const client = new WebClient();

	test( `Correct message is sent to Slack`, async () => {
		// Mock workflow conclusion
		const utils = require( '../src/utils' );
		jest.spyOn( utils, 'isWorkflowFailed' ).mockImplementation().mockReturnValueOnce( true );

		// Mock notification text
		const expectedText = 'This is the message text';
		jest
			.spyOn( utils, 'getNotificationText' )
			.mockImplementation()
			.mockReturnValueOnce( expectedText );

		// Run the action
		const action = await require( '../src/index' );
		await action;

		// Expect that Slack client gets called with the right arguments
		await expect( client.chat.postMessage ).toHaveBeenCalledWith(
			expect.objectContaining( {
				text: expectedText,
				channel: slackChannel,
				username: slackUsername,
				icon_emoji: ':red_circle:',
			} )
		);
	} );
} );
