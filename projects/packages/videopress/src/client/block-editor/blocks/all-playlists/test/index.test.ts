import { registerBlockType } from '@wordpress/blocks';
import '../index';

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: jest.fn(),
} ) );

// Keep the registration test from dragging in the whole block editor.
jest.mock( '../edit', () => ( {
	__esModule: true,
	default: () => null,
} ) );

const registerBlockTypeMock = registerBlockType as jest.Mock;

describe( 'all playlists block registration', () => {
	it( 'registers videopress/all-playlists as a dynamic block', () => {
		expect( registerBlockTypeMock ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockTypeMock.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/all-playlists' );
		expect( settings.title ).toBe( 'All Playlists' );
		expect( settings.category ).toBe( 'media' );
		expect( typeof settings.edit ).toBe( 'function' );
		expect( settings.icon ).toBeDefined();
		expect( settings.attributes.layout.default ).toBe( 'grid' );
		expect( settings.attributes.layout.enum ).toEqual( [ 'grid', 'list' ] );

		// Dynamic block: the front end comes from the PHP render callback.
		expect( settings.save() ).toBeNull();
	} );
} );
