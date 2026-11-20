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

describe( 'channel details block registration', () => {
	it( 'registers videopress/channel-details as a dynamic block', () => {
		expect( registerBlockTypeMock ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = registerBlockTypeMock.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/channel-details' );
		expect( settings.title ).toBe( 'Channel Details' );
		expect( settings.category ).toBe( 'media' );
		expect( settings.icon ).toBeDefined();
		expect( settings.attributes.items.default ).toEqual( [
			'handle',
			'subscribers',
			'videos',
			'playlists',
		] );
		// The markup comes from the PHP render callback, so nothing is serialized.
		expect( settings.save() ).toBeNull();
	} );
} );
