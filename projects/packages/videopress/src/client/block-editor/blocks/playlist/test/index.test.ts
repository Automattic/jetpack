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

describe( 'playlist block registration', () => {
	it( 'registers videopress/playlist as a dynamic block', () => {
		expect( registerBlockTypeMock ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockTypeMock.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/playlist' );
		expect( settings.title ).toBe( 'Video Playlist' );
		expect( settings.category ).toBe( 'media' );
		expect( typeof settings.edit ).toBe( 'function' );
		expect( settings.icon ).toBeDefined();
		expect( settings.attributes.videos.default ).toEqual( [] );
		expect( settings.attributes.showPlaylistTitle.default ).toBe( true );

		// Dynamic block: save() keeps only the title heading inner block in the post.
		expect( settings.save() ).not.toBeNull();
	} );
} );
