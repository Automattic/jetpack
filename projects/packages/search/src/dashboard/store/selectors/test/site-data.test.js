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
		expect( siteDataSelectors.isBlockTheme( { siteData: { themeSupportsBlocks: false } } ) ).toBe(
			false
		);
		expect( siteDataSelectors.isBlockTheme( { siteData: { themeSupportsBlocks: true } } ) ).toBe(
			true
		);
	} );

	test( 'fails open to true when theme block support is absent', () => {
		expect( siteDataSelectors.isBlockTheme( {} ) ).toBe( true );
		expect( siteDataSelectors.isBlockTheme( { siteData: {} } ) ).toBe( true );
	} );

	test( 'returns the product search template config from siteData', () => {
		const config = {
			enabled: true,
			editorUrl: 'https://example.com/wp-admin/post.php?post=42&action=edit',
			postType: 'jp_product_search',
			isCustomized: false,
		};
		expect(
			siteDataSelectors.getProductSearchTemplateConfig( {
				siteData: { productSearchTemplate: config },
			} )
		).toEqual( config );
	} );

	test( 'falls back to the singleton-template default when productSearchTemplate is missing', () => {
		// Match `singletonTemplateConfigDefault` in site-data.js: a stale or
		// older initial-state blob must read as "no customization, no link"
		// instead of crashing on undefined property reads in the WC control.
		const fallback = {
			enabled: false,
			editorUrl: null,
			postType: null,
			isCustomized: false,
		};
		expect( siteDataSelectors.getProductSearchTemplateConfig( {} ) ).toEqual( fallback );
		expect( siteDataSelectors.getProductSearchTemplateConfig( { siteData: {} } ) ).toEqual(
			fallback
		);
	} );

	test( 'returns the product overlay template config from siteData', () => {
		const config = {
			enabled: true,
			editorUrl: 'https://example.com/wp-admin/post.php?post=43&action=edit',
			postType: 'jp_search_prod_ovl',
			isCustomized: false,
		};
		expect(
			siteDataSelectors.getProductOverlayTemplateConfig( {
				siteData: { productOverlayTemplate: config },
			} )
		).toEqual( config );
	} );

	test( 'falls back to the singleton-template default when productOverlayTemplate is missing', () => {
		const fallback = {
			enabled: false,
			editorUrl: null,
			postType: null,
			isCustomized: false,
		};
		expect( siteDataSelectors.getProductOverlayTemplateConfig( {} ) ).toEqual( fallback );
		expect( siteDataSelectors.getProductOverlayTemplateConfig( { siteData: {} } ) ).toEqual(
			fallback
		);
	} );
} );
