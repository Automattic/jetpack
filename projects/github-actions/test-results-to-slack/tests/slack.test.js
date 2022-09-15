const path = require( 'path' );
const { WebClient } = require( '@slack/web-api' );

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
			update: jest.fn(),
		},
		files: {
			upload: jest.fn(),
		},
		conversations: {
			history: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

const slackClient = new WebClient();

describe( 'Find existing messages', () => {
	const messageIdentifier = '123-abc';

	test.each`
		expected                                          | description                                                         | response
		${ undefined }                                    | ${ 'No message is returned when there are no messages in channel' } | ${ { ok: true, messages: [] } }
		${ undefined }                                    | ${ 'No message is returned when there is no match' }                | ${ { ok: true, messages: [ { text: 'some text' }, { text: 'some other text' } ] } }
		${ { text: `some text ${ messageIdentifier }` } } | ${ 'Message is returned when there is a partial match' }            | ${ { ok: true, messages: [ { text: `some text ${ messageIdentifier }` }, { text: 'some other text' } ] } }
		${ { text: messageIdentifier } }                  | ${ 'Message is returned when there is a full match' }               | ${ { ok: true, messages: [ { text: `${ messageIdentifier }` } ] } }
		${ { text: `first ${ messageIdentifier }` } }     | ${ 'First message is returned when there is a multi match' }        | ${ { ok: true, messages: [ { text: `first ${ messageIdentifier }` }, { text: `second ${ messageIdentifier }` } ] } }
	`( '$description', async ( { expected, response } ) => {
		slackClient.conversations.history.mockResolvedValue( response );

		const { getMessage } = require( '../src/slack' );
		const message = await getMessage( slackClient, '123abc', messageIdentifier );
		await expect( JSON.stringify( message ) ).toBe( JSON.stringify( expected ) );
	} );
} );

describe( 'Blocks chunks', () => {
	test.each`
		description                     | blocks                                                                                                        | type           | maxSize | expected
		${ '5 blocks 1 matching type' } | ${ [ { type: 'context' }, { type: 'whatever' }, { type: 'context' }, { type: 'match' }, { type: 'other' } ] } | ${ 'match' }   | ${ 2 }  | ${ [ [ { type: 'context' }, { type: 'whatever' } ], [ { type: 'context' } ], [ { type: 'match' } ], [ { type: 'other' } ] ] }
		${ 'no matching type' }         | ${ [ { type: 'context' }, { type: 'whatever' }, { type: 'context' }, { type: 'match' }, { type: 'other' } ] } | ${ 'nomatch' } | ${ 2 }  | ${ [ [ { type: 'context' }, { type: 'whatever' } ], [ { type: 'context' }, { type: 'match' } ], [ { type: 'other' } ] ] }
		${ 'all matching type' }        | ${ [ { type: 'match' }, { type: 'match' }, { type: 'match' } ] }                                              | ${ 'match' }   | ${ 2 }  | ${ [ [ { type: 'match' } ], [ { type: 'match' } ], [ { type: 'match' } ] ] }
		${ 'no blocks' }                | ${ [] }                                                                                                       | ${ 'match' }   | ${ 2 }  | ${ [] }
	`(
		'Blocks are chunked by delimiter: $description',
		async ( { blocks, maxSize, type, expected } ) => {
			const { getBlocksChunks } = require( '../src/slack' );
			const chunks = getBlocksChunks( blocks, maxSize, type );
			expect( chunks ).toEqual( expected );
		}
	);
} );

describe( 'Post message', () => {
	test.each`
		isUpdate   | expectedMethod
		${ false } | ${ 'postMessage' }
		${ true }  | ${ 'update' }
	`( 'Message is sent: $expectedMethod', async ( { isUpdate, expectedMethod } ) => {
		const { postOrUpdateMessage } = require( '../src/slack' );
		const text = 'Notification text';
		const blocks = [ { type: 'context' } ];
		const channel = '123abc';
		const username = 'slack.username';
		const icon_emoji = ':red_circle:';
		const ts = '12345';
		const thread_ts = '123456';

		await postOrUpdateMessage( slackClient, isUpdate, {
			text,
			blocks,
			channel,
			username,
			icon_emoji,
			ts,
			thread_ts,
		} );

		await expect( slackClient.chat[ expectedMethod ] ).toHaveBeenCalledWith(
			expect.objectContaining( {
				text,
				channel,
				username,
				icon_emoji,
				ts,
				thread_ts,
			} )
		);
	} );

	test( 'File is uploaded', async () => {
		const { postOrUpdateMessage } = require( '../src/slack' );
		const filePath = path.resolve(
			'tests/resources/playwright/suite-1/results/spec-1/test-failed-1.png'
		);
		const blocks = [
			{ type: 'context' },
			{
				type: 'file',
				path: filePath,
			},
		];
		const channel = '123abc';
		const thread_ts = '12345';

		await postOrUpdateMessage( slackClient, false, {
			blocks,
			channel,
			thread_ts,
		} );

		await expect( slackClient.files.upload ).toHaveBeenCalledWith(
			expect.objectContaining( {
				file: expect.objectContaining( { path: filePath } ),
				channels: channel,
				thread_ts,
			} )
		);
	} );
} );
