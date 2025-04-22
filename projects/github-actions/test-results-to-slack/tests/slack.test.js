const path = require( 'path' );
const { WebClient } = require( '@slack/web-api' );

jest.mock( '@slack/web-api', () => {
	const slack = {
		chat: {
			postMessage: jest.fn(),
			update: jest.fn(),
		},
		filesUploadV2: jest.fn(),
		conversations: {
			history: jest.fn(),
		},
	};
	return { WebClient: jest.fn( () => slack ) };
} );

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock fs.statSync and fs.createReadStream
const mockStatSync = jest.fn().mockReturnValue( { size: 12345 } );
const mockCreateReadStream = jest.fn().mockReturnValue( {
	on: jest.fn().mockImplementation( ( event, callback ) => {
		if ( event === 'end' ) {
			callback();
		}
		return this;
	} ),
} );

jest.mock( 'fs', () => ( {
	...jest.requireActual( 'fs' ),
	statSync: mockStatSync,
	createReadStream: mockCreateReadStream,
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
} );

describe( 'File Upload', () => {
	const filePath = path.resolve(
		'tests/resources/playwright/suite-1/results/spec-1/test-failed-1.png'
	);
	const channel = '123abc';
	const thread_ts = '12345';

	beforeEach( () => {
		// Reset all mocks before each test
		jest.clearAllMocks();
	} );

	test( 'Successfully uploads a file', async () => {
		const { postOrUpdateMessage } = require( '../src/slack' );
		const blocks = [
			{ type: 'context' },
			{
				type: 'file',
				path: filePath,
			},
		];

		slackClient.filesUploadV2.mockResolvedValue( {
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

		// Verify filesUploadV2 was called with correct parameters
		expect( slackClient.filesUploadV2 ).toHaveBeenCalledWith( {
			channel_id: channel,
			thread_ts,
			file: filePath,
			filename: 'test-failed-1.png',
		} );
	} );

	test( 'Handles file not found error', async () => {
		const { postOrUpdateMessage } = require( '../src/slack' );
		const nonExistentPath = '/path/to/nonexistent/file.png';
		const blocks = [
			{ type: 'context' },
			{
				type: 'file',
				path: nonExistentPath,
			},
		];

		await expect(
			postOrUpdateMessage( slackClient, false, {
				blocks,
				channel,
				thread_ts,
			} )
		).rejects.toThrow( 'File not found' );

		// Verify no API calls were made
		expect( slackClient.filesUploadV2 ).not.toHaveBeenCalled();
	} );

	test( 'Handles upload failure', async () => {
		const { postOrUpdateMessage } = require( '../src/slack' );
		slackClient.filesUploadV2.mockResolvedValue( {
			ok: false,
			error: 'upload_failed',
		} );

		const blocks = [
			{ type: 'context' },
			{
				type: 'file',
				path: filePath,
			},
		];

		await expect(
			postOrUpdateMessage( slackClient, false, {
				blocks,
				channel,
				thread_ts,
			} )
		).rejects.toThrow( 'Failed to upload file' );
	} );
} );
