const { WebClient } = require( '@slack/web-api' );
const nock = require( 'nock' );
const { setInputData } = require( './test-utils' );

describe( 'Existing messages', () => {
	const messageIdentifier = '123-abc';

	test.each`
		expected                                          | description                                                         | response
		${ undefined }                                    | ${ 'No message is returned when there are no messages in channel' } | ${ { ok: true, messages: [] } }
		${ undefined }                                    | ${ 'No message is returned when there is no match' }                | ${ { ok: true, messages: [ { text: 'some text' }, { text: 'some other text' } ] } }
		${ { text: `some text ${ messageIdentifier }` } } | ${ 'Message is returned when there is a partial match' }            | ${ { ok: true, messages: [ { text: `some text ${ messageIdentifier }` }, { text: 'some other text' } ] } }
		${ { text: messageIdentifier } }                  | ${ 'Message is returned when there is a full match' }               | ${ { ok: true, messages: [ { text: `${ messageIdentifier }` } ] } }
		${ { text: `first ${ messageIdentifier }` } }     | ${ 'First message is returned when there is a multi match' }        | ${ { ok: true, messages: [ { text: `first ${ messageIdentifier }` }, { text: `second ${ messageIdentifier }` } ] } }
	`( '$description', async ( { expected, response } ) => {
		nock( 'https://slack.com' )
			.post( `/api/conversations.history`, /channel=\w+/gi )
			.reply( 200, response );

		const { getMessage } = require( '../src/slack' );
		const message = await getMessage( new WebClient( 'token' ), '123abc', messageIdentifier );
		await expect( JSON.stringify( message ) ).toBe( JSON.stringify( expected ) );
	} );
} );

describe.skip( 'Notification is sent', () => {
	jest.mock( '@slack/web-api', () => {
		const slack = {
			chat: {
				postMessage: jest.fn(),
			},
		};
		return { WebClient: jest.fn( () => slack ) };
	} );

	const slackChannel = '1234ABCD';
	const slackUsername = 'Test Reporter';

	beforeAll( () => {
		setInputData( { slackChannel, slackUsername } );
	} );

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
