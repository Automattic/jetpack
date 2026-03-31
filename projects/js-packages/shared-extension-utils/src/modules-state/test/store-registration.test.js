/**
 * Each test uses jest.isolateModules() because the store registration
 * logic runs at module scope (side effect of importing the index).
 */

jest.mock( '@wordpress/data', () => ( {
	createReduxStore: jest.fn( () => 'mock-store' ),
	register: jest.fn(),
	select: jest.fn(),
	dispatch: jest.fn( () => ( { setJetpackModules: jest.fn() } ) ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: jest.fn().mockReturnValue( false ),
} ) );

beforeEach( () => {
	delete window.Initial_State;
	delete window.Jetpack_Editor_Initial_State;
} );

describe( 'modules-state store registration guard', () => {
	it( 'registers the store when not already registered', () => {
		jest.isolateModules( () => {
			const { select, register } = require( '@wordpress/data' );
			select.mockReturnValue( undefined );
			require( '../index' );
			expect( register ).toHaveBeenCalledWith( 'mock-store' );
		} );
	} );

	it( 'skips registration when store already registered', () => {
		jest.isolateModules( () => {
			const { select, register } = require( '@wordpress/data' );
			select.mockReturnValue( {} );
			require( '../index' );
			expect( register ).not.toHaveBeenCalled();
		} );
	} );
} );

describe( 'modules-state initial data population', () => {
	it( 'populates initial data from Jetpack_Editor_Initial_State', () => {
		const modules = { markdown: { activated: true } };
		window.Jetpack_Editor_Initial_State = { modules };

		jest.isolateModules( () => {
			const { select, dispatch } = require( '@wordpress/data' );
			const setJetpackModules = jest.fn();
			select.mockReturnValue( undefined );
			dispatch.mockReturnValue( { setJetpackModules } );
			require( '../index' );
			expect( setJetpackModules ).toHaveBeenCalledWith( { data: { ...modules } } );
		} );
	} );

	it( 'populates initial data from Initial_State', () => {
		const getModules = { stats: { activated: true } };
		window.Initial_State = { getModules };

		jest.isolateModules( () => {
			const { select, dispatch } = require( '@wordpress/data' );
			const setJetpackModules = jest.fn();
			select.mockReturnValue( undefined );
			dispatch.mockReturnValue( { setJetpackModules } );
			require( '../index' );
			expect( setJetpackModules ).toHaveBeenCalledWith( { data: { ...getModules } } );
		} );
	} );

	it( 'does not dispatch when no initial data available', () => {
		jest.isolateModules( () => {
			const { select, dispatch } = require( '@wordpress/data' );
			select.mockReturnValue( undefined );
			require( '../index' );
			expect( dispatch ).not.toHaveBeenCalled();
		} );
	} );
} );
