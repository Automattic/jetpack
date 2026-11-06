/*
 * Each `loadCopy()` evaluates the package afresh, as a second bundle that ships its own copy
 * would, while every copy shares one `@wordpress/data` registry, as they do through `wp.data`.
 */
import * as wpData from '@wordpress/data';

let registry;

const loadCopy = () =>
	jest.isolateModules( () => {
		jest.doMock( '@wordpress/data', () => ( {
			...wpData,
			register: registry.register,
			select: registry.select,
			dispatch: registry.dispatch,
		} ) );
		require( '../../index.js' );
	} );

describe( 'several copies of the package on one page', () => {
	beforeEach( () => {
		registry = wpData.createRegistry();
		window.Initial_State = { getModules: { stats: { activated: false } } };
	} );

	afterEach( () => {
		delete window.Initial_State;
		delete window.Jetpack_Editor_Initial_State;
	} );

	it.each( [
		[ 'Initial_State', { getModules: { stats: { activated: true } } } ],
		[ 'Jetpack_Editor_Initial_State', { modules: { stats: { activated: true } } } ],
	] )( 'the first copy seeds module state from window.%s', ( global, value ) => {
		delete window.Initial_State;
		window[ global ] = value;

		loadCopy();

		expect( registry.select( 'jetpack-modules' ).isModuleActive( 'stats' ) ).toBe( true );
	} );

	it.each( [ 'jetpack-modules', 'wordpress-com/plans' ] )(
		'a later copy does not register %s again',
		storeId => {
			loadCopy();
			loadCopy();

			expect( console ).not.toHaveErroredWith( `Store "${ storeId }" is already registered.` );
		}
	);

	it( 'a later copy keeps module state that changed after the page loaded', () => {
		loadCopy();
		registry
			.dispatch( 'jetpack-modules' )
			.setJetpackModules( { data: { stats: { activated: true } } } );

		loadCopy();

		expect( registry.select( 'jetpack-modules' ).isModuleActive( 'stats' ) ).toBe( true );
	} );
} );
