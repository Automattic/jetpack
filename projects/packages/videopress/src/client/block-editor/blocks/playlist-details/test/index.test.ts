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

describe( 'playlist details block registration', () => {
	it( 'registers videopress/playlist-details as a dynamic block', () => {
		const [ name, settings ] = ( registerBlockType as jest.Mock ).mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/playlist-details' );
		expect( settings.title ).toBe( 'Playlist Details' );
		expect( settings.attributes.source.default ).toBe( 'queried' );
		// The markup comes from the PHP render callback, so nothing is serialized.
		expect( settings.save() ).toBeNull();
	} );
} );
