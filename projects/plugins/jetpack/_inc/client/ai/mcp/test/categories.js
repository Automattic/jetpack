import {
	DISPLAY_CATEGORIES,
	getDisplayCategory,
	getSubCategory,
	isWriteTool,
	sortTools,
} from '../categories';

describe( 'MCP category mapping', () => {
	test.each( [ 'wpcom-mcp', 'developer-testing' ] )(
		'maps %s API category to Developer & testing',
		category => {
			expect( getDisplayCategory( 'tool-id', { category } ) ).toBe(
				DISPLAY_CATEGORIES.DEVELOPER_TESTING
			);
		}
	);

	test.each( [ 'jetpack', 'wpcom' ] )(
		'does not map the entire %s API category to Developer & testing',
		category => {
			expect( getDisplayCategory( 'tool-id', { category } ) ).toBe(
				DISPLAY_CATEGORIES.UNCATEGORIZED
			);
		}
	);

	test.each( [
		'jetpack/search-voice',
		'jetpack-search-voice',
		'wpcom-mcp/jetpack-search-voice',
		'wpcom-mcp-jetpack-search-voice',
	] )( 'maps %s tool ID to Developer & testing', toolId => {
		expect( getDisplayCategory( toolId, { category: 'posts' } ) ).toBe(
			DISPLAY_CATEGORIES.DEVELOPER_TESTING
		);
	} );

	test( 'maps search voice ability names to Developer & testing', () => {
		expect(
			getDisplayCategory( 'tool-id', {
				category: 'posts',
				name: 'wpcom-mcp/jetpack-search-voice',
			} )
		).toBe( DISPLAY_CATEGORIES.DEVELOPER_TESTING );
	} );

	test( 'maps known API categories to their display category', () => {
		expect( getDisplayCategory( 'tool-id', { category: 'posts' } ) ).toBe(
			DISPLAY_CATEGORIES.POSTS
		);
		expect( getDisplayCategory( 'tool-id', { category: 'domains' } ) ).toBe(
			DISPLAY_CATEGORIES.DOMAINS
		);
	} );

	test( 'falls back to Uncategorized when no mapped category is available', () => {
		expect( getDisplayCategory( 'tool-id', { category: 'unknown' } ) ).toBe(
			DISPLAY_CATEGORIES.UNCATEGORIZED
		);
		expect( getDisplayCategory( 'tool-id' ) ).toBe( DISPLAY_CATEGORIES.UNCATEGORIZED );
	} );

	test( 'returns the matching sub-category for known API categories', () => {
		expect( getSubCategory( 'tool-id', { category: 'comments' } ) ).toBe( 'Comments' );
		expect( getSubCategory( 'tool-id', { category: 'site-settings' } ) ).toBe( 'Site settings' );
	} );

	test( 'returns undefined when no sub-category is available', () => {
		expect( getSubCategory( 'tool-id', { category: 'domains' } ) ).toBeUndefined();
		expect( getSubCategory( 'tool-id' ) ).toBeUndefined();
	} );

	test( 'identifies write tools by readonly flag', () => {
		expect( isWriteTool( 'tool-id', { readonly: false } ) ).toBe( true );
		expect( isWriteTool( 'tool-id', { readonly: true } ) ).toBe( false );
		expect( isWriteTool( 'tool-id' ) ).toBe( false );
	} );

	test( 'leaves tool order unchanged', () => {
		const tools = [
			[ 'first', {} ],
			[ 'second', {} ],
		];

		expect( sortTools( tools ) ).toBe( tools );
	} );
} );
