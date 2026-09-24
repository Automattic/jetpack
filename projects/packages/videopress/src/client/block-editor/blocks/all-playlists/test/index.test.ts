import { registerBlockType } from '@wordpress/blocks';
import '../index';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );

// Keep the registration test from dragging in the whole block editor.
jest.mock( '@wordpress/block-editor', () => ( {
	InnerBlocks: { Content: () => null },
} ) );
jest.mock( '../edit', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const registerBlockTypeMock = registerBlockType as jest.Mock;

describe( 'all playlists block registration', () => {
	it( 'registers videopress/all-playlists with its heading inner block saved', () => {
		expect( registerBlockTypeMock ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockTypeMock.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/all-playlists' );
		expect( settings.title ).toBe( 'All Playlists' );
		expect( settings.category ).toBe( 'media' );
		expect( typeof settings.edit ).toBe( 'function' );
		expect( settings.icon ).toBeDefined();

		const { attributes } = settings;
		expect( attributes.layout.default ).toBe( 'gallery' );
		expect( attributes.layout.enum ).toEqual( [ 'gallery', 'list' ] );
		expect( attributes.columns.default ).toBe( 3 );
		expect( attributes.perPage.default ).toBe( 6 );
		expect( attributes.orderBy.default ).toBe( 'newest' );
		expect( attributes.showDescription.default ).toBe( true );
		expect( attributes.showVideoCount.default ).toBe( true );
		expect( attributes.showTotalRuntime.default ).toBe( false );
		expect( attributes.pagination.default ).toBe( 'numbered' );

		// Dynamic block: save() keeps only the heading inner block in the post.
		expect( typeof settings.save ).toBe( 'function' );
		expect( settings.save() ).not.toBeNull();
	} );
} );
