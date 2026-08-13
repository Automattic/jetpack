const mockRegisterBlockType = jest.fn();

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: mockRegisterBlockType,
} ) );

// The edit component pulls in the real block-editor package, which expects a
// full editor runtime; the registration test only needs stand-ins.
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: () => null,
} ) );

describe( 'playlist block registration', () => {
	it( 'registers videopress/playlist with an edit implementation', async () => {
		await import( '../index' );

		expect( mockRegisterBlockType ).toHaveBeenCalledTimes( 1 );

		const [ name, settings ] = mockRegisterBlockType.mock.calls[ 0 ];
		expect( name ).toBe( 'videopress/playlist' );
		expect( settings.edit ).toEqual( expect.any( Function ) );
		expect( settings.save() ).toBeNull();
		expect( settings.attributes ).toHaveProperty( 'videos' );
	} );
} );
