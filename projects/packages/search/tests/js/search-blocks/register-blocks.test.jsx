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

describe( 'register-blocks widget area gate', () => {
	const HOOK = 'blockEditor.__unstableCanInsertBlockType';
	const OVERLAY_AREA = 'jetpack-instant-search-side-bar';
	const SEARCH_BLOCK = { name: 'jetpack-search/filter-checkbox' };

	const loadWithConfig = config => {
		let addFilter;
		globalThis.JetpackSearchBlocksConfig = config;
		jest.isolateModules( () => {
			addFilter = require( '@wordpress/hooks' ).addFilter;
			addFilter.mockClear();
			require( '../../../src/search-blocks/editor/register-blocks' );
		} );
		return addFilter.mock.calls.find( ( [ hookName ] ) => hookName === HOOK )?.[ 2 ];
	};

	const editorWith = blocks => ( {
		getBlock: clientId => blocks[ clientId ] ?? null,
		getBlockParentsByBlockName: ( clientId, blockName ) =>
			( blocks[ clientId ]?.parents ?? [] ).filter( id => blocks[ id ].name === blockName ),
	} );

	const editor = editorWith( {
		overlay: { name: 'core/widget-area', attributes: { id: OVERLAY_AREA } },
		footer: { name: 'core/widget-area', attributes: { id: 'sidebar-1' } },
		overlayFilters: { name: 'jetpack-search/filters', attributes: {}, parents: [ 'overlay' ] },
		footerFilters: { name: 'jetpack-search/filters', attributes: {}, parents: [ 'footer' ] },
	} );

	afterEach( () => {
		delete globalThis.JetpackSearchBlocksConfig;
		delete window.wp;
	} );

	it( 'registers no filter when no widget area needs hiding', () => {
		expect( loadWithConfig( { hideFromWidgetArea: null } ) ).toBeUndefined();
	} );

	it( 'blocks Search blocks in the named widget area', () => {
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

		expect( canInsert( true, SEARCH_BLOCK, 'overlay', editor ) ).toBe( false );
	} );

	it( 'blocks Search blocks inside a container in the named widget area', () => {
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

		expect( canInsert( true, SEARCH_BLOCK, 'overlayFilters', editor ) ).toBe( false );
	} );

	it( 'allows Search blocks in other widget areas', () => {
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

		expect( canInsert( true, SEARCH_BLOCK, 'footer', editor ) ).toBe( true );
		expect( canInsert( true, SEARCH_BLOCK, 'footerFilters', editor ) ).toBe( true );
	} );

	it( 'allows other blocks in the named widget area', () => {
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

		expect( canInsert( true, { name: 'core/paragraph' }, 'overlay', editor ) ).toBe( true );
	} );

	it( 'never allows a block core already refused', () => {
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

		expect( canInsert( false, SEARCH_BLOCK, 'footer', editor ) ).toBe( false );
	} );

	it.each( [
		[ `sidebar-widgets-${ OVERLAY_AREA }`, false ],
		[ 'sidebar-widgets-sidebar-1', true ],
	] )(
		'in the Customizer, with section %s expanded, allows Search blocks: %s',
		( expanded, allowed ) => {
			window.wp = { customize: { section: id => ( { expanded: () => id === expanded } ) } };
			const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );

			expect( canInsert( true, SEARCH_BLOCK, '', editorWith( {} ) ) ).toBe( allowed );
		}
	);

	it( 'in the Customizer, blocks Search blocks inside a container in the named area', () => {
		window.wp = {
			customize: {
				section: id => ( { expanded: () => id === `sidebar-widgets-${ OVERLAY_AREA }` } ),
			},
		};
		const canInsert = loadWithConfig( { hideFromWidgetArea: OVERLAY_AREA } );
		const customizerEditor = editorWith( {
			filters: { name: 'jetpack-search/filters', attributes: {} },
		} );

		expect( canInsert( true, SEARCH_BLOCK, 'filters', customizerEditor ) ).toBe( false );
	} );
} );
