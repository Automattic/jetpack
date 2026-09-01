const HOOK = 'divi.moduleLibrary.registerModuleLibraryStore.after';

describe( 'Divi 5 module registration', () => {
	let registerModule;

	beforeEach( () => {
		registerModule = jest.fn();
		window.divi = { moduleLibrary: { registerModule }, module: {}, fieldLibrary: {} };
	} );

	afterEach( () => {
		delete window.divi;
	} );

	it( 'registers immediately when the store-ready action already fired', () => {
		jest.isolateModules( () => {
			require( '@wordpress/hooks' ).doAction( HOOK );
			require( '../index.js' );
		} );

		expect( registerModule ).toHaveBeenCalledWith( expect.anything(), expect.anything() );
	} );

	it( 'registers when the store-ready action fires after load', () => {
		jest.isolateModules( () => {
			require( '../index.js' );
			expect( registerModule ).not.toHaveBeenCalled();
			require( '@wordpress/hooks' ).doAction( HOOK );
		} );

		expect( registerModule ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not register and logs when the builder runtime is incomplete', () => {
		// Missing window.divi.module / fieldLibrary.
		window.divi = { moduleLibrary: { registerModule } };
		const error = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		jest.isolateModules( () => {
			require( '@wordpress/hooks' ).doAction( HOOK );
			require( '../index.js' );
		} );

		expect( registerModule ).not.toHaveBeenCalled();
		expect( error ).toHaveBeenCalled();
		error.mockRestore();
	} );
} );
