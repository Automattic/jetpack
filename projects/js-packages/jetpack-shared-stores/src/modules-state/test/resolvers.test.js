import { SET_JETPACK_MODULES } from '../actions';
import { FETCH_JETPACK_MODULES } from '../controls';
import { getJetpackModules } from '../resolvers';

describe( 'getJetpackModules resolver', () => {
	const loading = isLoading => ( { type: SET_JETPACK_MODULES, options: { isLoading } } );

	test( 'loads modules then returns the set-modules action (after clearing loading)', () => {
		const data = { 'test-module': { activated: true } };
		const generator = getJetpackModules();

		// Mark modules as loading.
		expect( generator.next().value ).toEqual( loading( true ) );

		// Request the modules from the server.
		expect( generator.next().value ).toEqual( { type: FETCH_JETPACK_MODULES } );

		// The `return` is reached, but the `finally` clears loading before it resolves.
		expect( generator.next( data ).value ).toEqual( loading( false ) );

		// Finally completes and the resolver returns the modules data.
		const final = generator.next();
		expect( final.value ).toEqual( { type: SET_JETPACK_MODULES, options: { data } } );
		expect( final.done ).toBe( true );
	} );

	test( 'still clears loading when the server returns no data', () => {
		const generator = getJetpackModules();

		expect( generator.next().value ).toEqual( loading( true ) );
		expect( generator.next().value ).toEqual( { type: FETCH_JETPACK_MODULES } );

		// Falsy data skips the early return and falls through to `finally`.
		expect( generator.next( null ).value ).toEqual( loading( false ) );

		const final = generator.next();
		expect( final.value ).toBeUndefined();
		expect( final.done ).toBe( true );
	} );

	test( 'logs the error and still clears loading on failure', () => {
		const error = new Error( 'fetch failed' );
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		const generator = getJetpackModules();

		expect( generator.next().value ).toEqual( loading( true ) );
		expect( generator.next().value ).toEqual( { type: FETCH_JETPACK_MODULES } );

		// Inject a control failure; the catch logs it and `finally` clears loading.
		expect( generator.throw( error ).value ).toEqual( loading( false ) );
		expect( generator.next().done ).toBe( true );

		expect( consoleError ).toHaveBeenCalledWith( error );
		consoleError.mockRestore();
	} );
} );
