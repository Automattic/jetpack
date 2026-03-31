/**
 * Each test uses jest.isolateModules() because the store registration
 * logic runs at module scope (side effect of importing the index).
 */

jest.mock( '@wordpress/data', () => ( {
	createReduxStore: jest.fn( () => 'mock-store' ),
	register: jest.fn(),
	select: jest.fn(),
} ) );

describe( 'wordpress-com/plans store registration guard', () => {
	it( 'registers the store when not already registered', () => {
		jest.isolateModules( () => {
			const { select, register } = require( '@wordpress/data' );
			select.mockReturnValue( undefined );
			require( '../index.ts' );
			expect( register ).toHaveBeenCalledWith( 'mock-store' );
		} );
	} );

	it( 'skips registration when store already registered', () => {
		jest.isolateModules( () => {
			const { select, register } = require( '@wordpress/data' );
			select.mockReturnValue( {} );
			require( '../index.ts' );
			expect( register ).not.toHaveBeenCalled();
		} );
	} );
} );
