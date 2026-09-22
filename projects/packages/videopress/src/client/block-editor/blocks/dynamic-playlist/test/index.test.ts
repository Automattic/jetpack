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

describe( 'dynamic playlist block registration', () => {
	it( 'registers videopress/dynamic-playlist as a dynamic block', () => {
		expect( registerBlockTypeMock ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockTypeMock.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/dynamic-playlist' );
		expect( settings.title ).toBe( 'Dynamic Video Playlist' );
		expect( settings.category ).toBe( 'media' );
		expect( typeof settings.edit ).toBe( 'function' );
		expect( settings.icon ).toBeDefined();
		expect( settings.attributes.count.default ).toBe( 5 );
		// No stored entries: the videos come from the library at render time.
		expect( settings.attributes.videos ).toBeUndefined();

		// Dynamic block: the front end comes from the PHP render callback.
		expect( settings.save() ).toBeNull();
	} );
} );
