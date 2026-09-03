import { getAutoRecipient, getAutoRecipientHelpText } from '../auto-recipient';

describe( 'getAutoRecipient', () => {
	it( 'prefers the live post author email over the page-load value', () => {
		expect(
			getAutoRecipient( {
				serverSource: 'post_author',
				serverAddress: 'stale@example.com',
				postAuthorEmail: 'live@example.com',
			} )
		).toEqual( { address: 'live@example.com', source: 'post_author' } );
	} );

	it( 'falls back to the server address when the editor store has no author email', () => {
		expect(
			getAutoRecipient( {
				serverSource: 'post_author',
				serverAddress: 'author@example.com',
			} )
		).toEqual( { address: 'author@example.com', source: 'post_author' } );
	} );

	it( 'never substitutes the post author in the site admin branch', () => {
		expect(
			getAutoRecipient( {
				serverSource: 'site_admin',
				serverAddress: 'admin@example.com',
				postAuthorEmail: 'ignored@example.com',
			} )
		).toEqual( { address: 'admin@example.com', source: 'site_admin' } );
	} );

	it( 'predicts no address for a standalone form', () => {
		expect(
			getAutoRecipient( {
				serverSource: 'post_author',
				serverAddress: 'form-author@example.com',
				postAuthorEmail: 'form-author@example.com',
				isStandaloneForm: true,
			} )
		).toEqual( { address: '', source: 'embedding_post_author' } );
	} );

	it( 'treats an unknown or missing server source as the site admin branch', () => {
		expect( getAutoRecipient( { serverAddress: 'admin@example.com' } ) ).toEqual( {
			address: 'admin@example.com',
			source: 'site_admin',
		} );
	} );

	it( 'returns an empty address when nothing is known', () => {
		expect( getAutoRecipient( {} ) ).toEqual( { address: '', source: 'site_admin' } );
	} );
} );

describe( 'getAutoRecipientHelpText', () => {
	it( 'returns a distinct sentence for each source', () => {
		const texts = [
			getAutoRecipientHelpText( 'post_author' ),
			getAutoRecipientHelpText( 'site_admin' ),
			getAutoRecipientHelpText( 'embedding_post_author' ),
		];

		expect( new Set( texts ).size ).toBe( 3 );
		texts.forEach( text => expect( text ).toMatch( /^Leave empty to send responses to/ ) );
	} );
} );
