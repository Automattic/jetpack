const path = require( 'path' );
const { WebClient } = require( '@slack/web-api' );

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
			update: jest.fn(),
		},
		files: {
			getUploadURLExternal: jest.fn(),
			completeUploadExternal: jest.fn(),
		},
		conversations: {
			history: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock fs.statSync
jest.mock( 'fs', () => ( {
	...jest.requireActual( 'fs' ),
	statSync: jest.fn().mockReturnValue( {
		size: 12345,
	} ),
	createReadStream: jest.fn().mockReturnValue( {
		on: jest.fn().mockImplementation( ( event, callback ) => {
			if ( event === 'end' ) {
				callback();
			}
			return this;
		} ),
	} ),
} ) );

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
	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		mockFetch.mockResolvedValue( {
			ok: true,
			status: 200,
			json: () => Promise.resolve( {} ),
		} );
	} );

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

	test( 'File is uploaded using new three-step process', async () => {
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

		// Mock the three-step upload process
		slackClient.files.getUploadURLExternal.mockResolvedValue( {
			ok: true,
			upload_url: 'https://slack.com/api/upload',
			file_id: 'F1234567890',
		} );

		mockFetch.mockResolvedValue( {
			ok: true,
			status: 200,
			json: () => Promise.resolve( {} ),
		} );

		slackClient.files.completeUploadExternal.mockResolvedValue( {
			ok: true,
			file: {
				id: 'F1234567890',
			},
		} );

		await postOrUpdateMessage( slackClient, false, {
			blocks,
			channel,
			thread_ts,
		} );

		// Verify getUploadURLExternal was called with correct parameters
		expect( slackClient.files.getUploadURLExternal ).toHaveBeenCalledWith( {
			filename: 'test-failed-1.png',
			length: 12345,
		} );

		// Verify the file upload request was made
		expect( mockFetch ).toHaveBeenCalledWith(
			'https://slack.com/api/upload',
			expect.objectContaining( {
				method: 'POST',
				body: expect.any( Buffer ),
				headers: {
					'Content-Type': 'application/octet-stream',
				},
			} )
		);

		// Verify completeUploadExternal was called with correct parameters
		expect( slackClient.files.completeUploadExternal ).toHaveBeenCalledWith( {
			files: [ { id: 'F1234567890' } ],
			channel_id: channel,
			thread_ts,
		} );
	} );
} );
