import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useProtectSettings from '../use-protect-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );

const mockApiFetch = apiFetch as unknown as jest.Mock;

type Deferred = {
	promise: Promise< unknown >;
	resolve: ( value: unknown ) => void;
	reject: ( reason: unknown ) => void;
};

const defer = (): Deferred => {
	const deferred = {} as Deferred;
	deferred.promise = new Promise( ( resolve, reject ) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	} );
	return deferred;
};

/**
 * Answer the next settings GET and the next POST with the given promises.
 *
 * @param responses      - The promises to answer with.
 * @param responses.get  - Answers `GET /jetpack/v4/settings`.
 * @param responses.post - Answers any POST.
 */
const respondWith = ( { get, post }: { get?: Promise< unknown >; post?: Promise< unknown > } ) => {
	mockApiFetch.mockImplementation( ( { path, method } ) => {
		if ( method === 'POST' ) {
			return post;
		}
		return path === '/jetpack/v4/settings' ? get : Promise.resolve( null );
	} );
};

const settingsRequests = () =>
	mockApiFetch.mock.calls.filter(
		( [ { path, method } ] ) => path === '/jetpack/v4/settings' && method !== 'POST'
	);

describe( 'useProtectSettings', () => {
	beforeEach( () => mockApiFetch.mockReset() );

	it.each( [
		[ 'restores a key that had a value', { list: 'old' }, { list: 'old' } ],
		[ 'removes a key that had none', { other: 1 }, { other: 1 } ],
	] )( 'a failed save %s', async ( _name, loaded, expected ) => {
		respondWith( {
			get: Promise.resolve( loaded ),
			post: Promise.reject( { message: 'Nope' } ),
		} );
		const { result } = renderHook( () => useProtectSettings() );
		await act( async () => result.current.load() );

		await act( () => result.current.save( { list: 'new' } ) );

		expect( result.current.settings ).toEqual( expected );
		expect( result.current.error ).toBe( 'Nope' );
		expect( result.current.isSaving( 'list' ) ).toBe( false );
	} );

	it( 'keeps a value saved while the load was in flight', async () => {
		const get = defer();
		respondWith( { get: get.promise, post: Promise.resolve( {} ) } );
		const { result } = renderHook( () => useProtectSettings() );
		act( () => result.current.load() );
		await act( () => result.current.save( { list: 'new' } ) );

		await act( async () => get.resolve( { list: 'old', other: 1 } ) );

		expect( result.current.isLoaded ).toBe( true );
		expect( result.current.settings ).toEqual( { list: 'new', other: 1 } );
	} );

	it( 'refetches after a failed load, clearing the error', async () => {
		respondWith( { get: Promise.reject( new Error( 'offline' ) ) } );
		const { result } = renderHook( () => useProtectSettings() );
		await act( async () => result.current.load() );
		expect( result.current.error ).toEqual( expect.any( String ) );
		expect( result.current.isLoaded ).toBe( false );

		const retry = defer();
		respondWith( { get: retry.promise } );
		act( () => result.current.load() );
		expect( result.current.error ).toBeNull();
		await act( async () => retry.resolve( { other: 1 } ) );

		expect( settingsRequests() ).toHaveLength( 2 );
		expect( result.current.isLoaded ).toBe( true );
		expect( result.current.settings ).toEqual( { other: 1 } );
	} );
} );
