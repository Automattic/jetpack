const mockRegisterBlockType = jest.fn();

// Registration only stores references to the Edit components, it never renders one, so every editor
// export can be a stub. Importing the real `@wordpress/block-editor` here instead pulls in
// `@wordpress/private-apis` and throws "Cannot unlock an undefined object" under Jest.
const mockStubModule = () =>
	new Proxy(
		{ store: { name: 'core/block-editor' } },
		{
			get: ( target, key ) => {
				if ( key === '__esModule' ) {
					return true;
				}
				if ( typeof key === 'symbol' || key in target ) {
					return target[ key ];
				}
				target[ key ] = Object.assign( () => null, { Content: () => null } );
				return target[ key ];
			},
		}
	);

jest.mock( '@wordpress/block-editor', () => mockStubModule(), { virtual: false } );
jest.mock( '@wordpress/components', () => mockStubModule(), { virtual: false } );

jest.mock( '@wordpress/blocks', () => ( {
	registerBlockType: ( ...args ) => mockRegisterBlockType( ...args ),
	getCategories: () => [],
	setCategories: jest.fn(),
} ) );

jest.mock( '@wordpress/hooks', () => ( { addFilter: jest.fn() } ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: () => ( {} ),
	useDispatch: () => ( {} ),
	select: () => ( {} ),
	dispatch: () => ( {} ),
} ) );

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
	sprintf: text => text,
	_n: text => text,
	_x: text => text,
} ) );

const settingsFor = name =>
	mockRegisterBlockType.mock.calls.find( ( [ blockName ] ) => blockName === name )?.[ 1 ];

describe( 'register-blocks', () => {
	beforeAll( () => {
		require( '../../../src/search-blocks/editor/register-blocks' );
	} );

	it( 'gives the no-results variant a per-condition __experimentalLabel', () => {
		const settings = settingsFor( 'jetpack-search/no-results-slot' );

		expect( settings.__experimentalLabel ).toEqual( expect.any( Function ) );
		expect( settings.__experimentalLabel( { condition: 'filtered' } ) ).toBe(
			'Filters are active'
		);
		expect( settings.__experimentalLabel( {} ) ).toBe( 'Any empty search' );
	} );

	// The label is the variant's whole reason for overriding the block title; no other block wants one.
	it( 'gives no other block an __experimentalLabel', () => {
		const labelled = mockRegisterBlockType.mock.calls
			.filter( ( [ , settings ] ) => settings?.__experimentalLabel )
			.map( ( [ name ] ) => name );

		expect( labelled ).toEqual( [ 'jetpack-search/no-results-slot' ] );
	} );

	// Per-block settings are spread before these three, so an entry can never clobber them.
	it( 'keeps edit, save, and icon authoritative over per-block settings', () => {
		const settings = settingsFor( 'jetpack-search/no-results-slot' );

		expect( settings.edit ).toEqual( expect.any( Function ) );
		expect( settings.save ).toEqual( expect.any( Function ) );
		expect( settings.icon ).toBeDefined();
	} );
} );
