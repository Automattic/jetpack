import siteDataSelectors from '../site-data';

describe( 'siteDataSelectors', () => {
	test( 'returns the Reader Chat guidelines URL when available', () => {
		expect(
			siteDataSelectors.getReaderChatGuidelinesUrl( {
				siteData: {
					readerChatGuidelinesUrl:
						'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin',
				},
			} )
		).toBe( 'https://example.com/wp-admin/options-general.php?page=guidelines-wp-admin' );
	} );

	test( 'returns an empty Reader Chat guidelines URL by default', () => {
		expect( siteDataSelectors.getReaderChatGuidelinesUrl( {} ) ).toBe( '' );
	} );
} );
