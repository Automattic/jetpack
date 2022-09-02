const { WebClient } = require( '@slack/web-api' );
const nock = require( 'nock' );

const messageIdentifier = '123-abc';

describe( 'Existing messages', () => {
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
