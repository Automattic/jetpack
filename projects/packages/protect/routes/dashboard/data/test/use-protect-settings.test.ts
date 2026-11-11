import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { recordSettingEvents } from '../setting-events';
import useProtectSettings from '../use-protect-settings';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '../setting-events', () => ( { recordSettingEvents: jest.fn() } ) );

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
 * @param responses.get  - Answers `GET /jetpack/v4/protect-dashboard/settings`.
 * @param responses.post - Answers any POST.
 */
const respondWith = ( { get, post }: { get?: Promise< unknown >; post?: Promise< unknown > } ) => {
	mockApiFetch.mockImplementation( ( { path, method } ) => {
		if ( method === 'POST' ) {
			return post;
		}
		return path === '/jetpack/v4/protect-dashboard/settings' ? get : Promise.resolve( null );
	} );
};

const settingsRequests = () =>
	mockApiFetch.mock.calls.filter(
		( [ { path, method } ] ) =>
			path === '/jetpack/v4/protect-dashboard/settings' && method !== 'POST'
	);

const snackbars = () =>
	select( noticesStore )
		.getNotices()
		.filter( notice => notice.type === 'snackbar' )
		.map( notice => notice.content );

describe( 'useProtectSettings', () => {
	beforeEach( () => {
		mockApiFetch.mockReset();
		select( noticesStore )
			.getNotices()
			.forEach( notice => dispatch( noticesStore ).removeNotice( notice.id ) );
	} );

	it.each( [
		[
			'confirms a save',
			Promise.resolve( {} ),
			[ 'Settings updated.' ],
			[ [ { list: 'new' }, { list: 'old' } ] ],
		],
		[ 'stays quiet when a save fails', Promise.reject( { message: 'Nope' } ), [], [] ],
	] )( '%s in a snackbar and Tracks', async ( _name, post, expected, tracked ) => {
		respondWith( { get: Promise.resolve( { list: 'old' } ), post } );
		( recordSettingEvents as jest.Mock ).mockClear();
		const { result } = renderHook( () => useProtectSettings() );
		await act( async () => result.current.load() );

		await act( () => result.current.save( { list: 'new' } ) );

		expect( snackbars() ).toEqual( expected );
		expect( ( recordSettingEvents as jest.Mock ).mock.calls ).toEqual( tracked );
	} );

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
		expect( result.current.errorKeys ).toEqual( [ 'list' ] );
		expect( result.current.isSaving( 'list' ) ).toBe( false );
	} );

	it.each( [
		[
			'file_system_error',
			'The firewall couldn’t update its files on your server.',
			{ list: 'stored' },
		],
		[
			'rules_api_error',
			'The latest automatic firewall rules couldn’t be retrieved.',
			{ list: 'stored' },
		],
		[ 'waf_error', 'The firewall couldn’t finish applying your change.', { list: 'stored' } ],
		[ 'other_error', 'Raw server text', {} ],
		[
			'rest_invalid_param',
			'Your IP address is on the block list.',
			{},
			{ params: { list: 'Your IP address is on the block list.' } },
		],
	] )(
		'a failed save with the code %s shows "%s" and leaves %j',
		async ( code, message, expected, data: object = {} ) => {
			respondWith( {
				get: Promise.resolve( { list: 'stored', other: 1 } ),
				post: Promise.reject( { code, message: 'Raw server text', data } ),
			} );
			const { result } = renderHook( () => useProtectSettings() );

			await act( () => result.current.save( { list: 'new' } ) );

			expect( result.current.error ).toBe( message );
			expect( result.current.settings ).toEqual( expected );
		}
	);

	it( 'refresh takes only the requested keys from the server, even ones saved earlier', async () => {
		respondWith( {
			get: Promise.resolve( { email: true, other: 1 } ),
			post: Promise.resolve( {} ),
		} );
		const { result } = renderHook( () => useProtectSettings() );
		await act( () => result.current.save( { email: false, other: 2 } ) );

		await act( () => result.current.refresh( [ 'email' ] ) );

		expect( result.current.settings ).toEqual( { email: true, other: 2 } );
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

	it( 'keeps a later save when an earlier save of the same key fails', async () => {
		const first = defer();
		const second = defer();
		const posts = [ first.promise, second.promise ];
		mockApiFetch.mockImplementation( () => posts.shift() );
		const { result } = renderHook( () => useProtectSettings() );

		let firstSave: Promise< boolean >;
		act( () => {
			firstSave = result.current.save( { list: 'a' } );
		} );
		let secondSave: Promise< boolean >;
		act( () => {
			secondSave = result.current.save( { list: 'b' } );
		} );
		await act( async () => {
			second.resolve( {} );
			await secondSave;
		} );
		expect( result.current.isSaving( 'list' ) ).toBe( true );

		await act( async () => {
			first.reject( { message: 'Nope' } );
			await firstSave;
		} );

		expect( result.current.settings ).toEqual( { list: 'b' } );
		expect( result.current.isSaving( 'list' ) ).toBe( false );
	} );

	it( 'refetches after a failed load, clearing the error', async () => {
		respondWith( { get: Promise.reject( new Error( 'offline' ) ) } );
		const { result } = renderHook( () => useProtectSettings() );
		await act( async () => result.current.load() );
		expect( result.current.error ).toEqual( expect.any( String ) );
		expect( result.current.errorKeys ).toEqual( [] );
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
