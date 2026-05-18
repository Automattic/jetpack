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

	test( 'reports theme block support from siteData', () => {
		expect(
			siteDataSelectors.themeSupportsBlocks( { siteData: { themeSupportsBlocks: false } } )
		).toBe( false );
		expect(
			siteDataSelectors.themeSupportsBlocks( { siteData: { themeSupportsBlocks: true } } )
		).toBe( true );
	} );

	test( 'fails open to true when theme block support is absent', () => {
		expect( siteDataSelectors.themeSupportsBlocks( {} ) ).toBe( true );
		expect( siteDataSelectors.themeSupportsBlocks( { siteData: {} } ) ).toBe( true );
	} );
} );
