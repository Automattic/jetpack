import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryKeys, useSettings, useStatus } from '../data/queries';
import { useSaveSetting } from '../data/use-save-setting';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	createTestQueryClient,
	resetNotices,
	snackbarMessages,
	wrapperFor,
} from './helpers';
import type { Settings } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

/**
 * Render the save hook alongside active status and settings queries, as the screen does.
 *
 * @return Hook result and query client.
 */
function renderSave() {
	const queryClient = createTestQueryClient();
	const { result } = renderHook(
		() => {
			useStatus();
			useSettings();
			return useSaveSetting();
		},
		{ wrapper: wrapperFor( queryClient ) }
	);
	return { result, queryClient };
}

/**
 * A promise and the functions that settle it.
 *
 * @return Deferred.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	let reject!: ( reason: unknown ) => void;
	const promise = new Promise< T >( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
} );

describe( 'useSaveSetting', () => {
	it( 'sends only the changed key, then reads status again', async () => {
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'PUT' ? { ...baseSettings, likes_enabled: false } : baseStatus )
		);
		const { result } = renderSave();

		await act( () => result.current( 'likes_enabled', false ) );

		expect( apiCalls( 'PUT' ) ).toEqual( [
			{ path: '/wpcom/v2/sharing-likes/settings', method: 'PUT', data: { likes_enabled: false } },
		] );
		await waitFor( () =>
			expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/status' } )
		);
		expect( snackbarMessages() ).toContain( 'Settings have been saved' );
	} );

	it( 'replaces the cached settings with the response', async () => {
		// Saving can change which settings are offered, so keys come and go.
		const saved: Settings = { likes_enabled: true, reblogs_enabled: true, button_style: 'icon' };
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'PUT' ? saved : baseStatus )
		);
		const { result, queryClient } = renderSave();

		await act( () => result.current( 'button_style', 'icon' ) );

		expect( queryClient.getQueryData< Settings >( queryKeys.settings ) ).toEqual( saved );
	} );

	it( 'rolls back and shows the server message when a save fails', async () => {
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				return Promise.reject( {
					code: 'rest_sharing_likes_comment_likes_unchanged',
					message: 'Comment Likes could not be switched on or off on this site.',
				} );
			}
			// A settings read that never lands, so only the rollback can restore the value.
			return path?.endsWith( '/status' ) ? Promise.resolve( baseStatus ) : new Promise( () => {} );
		} );
		const { result, queryClient } = renderSave();

		await act( () => result.current( 'comment_likes_enabled', true ) );

		expect( queryClient.getQueryData< Settings >( queryKeys.settings ) ).toMatchObject( {
			comment_likes_enabled: false,
		} );
		expect( snackbarMessages() ).toContain(
			'Comment Likes could not be switched on or off on this site.'
		);
	} );

	it.each( [
		{
			outcome: 'lands',
			settle: ( first: ReturnType< typeof deferred< Settings > > ) =>
				first.resolve( { ...baseSettings, likes_enabled: false } ),
			likesEnabled: false,
		},
		{
			outcome: 'is refused',
			settle: ( first: ReturnType< typeof deferred< Settings > > ) =>
				first.reject( { message: 'Nope.' } ),
			likesEnabled: true,
		},
	] )(
		"keeps a queued save's value when an earlier save $outcome",
		async ( { settle, likesEnabled } ) => {
			const first = deferred< Settings >();
			const second = deferred< Settings >();
			mockApiFetch.mockImplementation( ( { method, data, path } ) => {
				if ( method !== 'PUT' ) {
					return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
				}
				return 'likes_enabled' in ( data as object ) ? first.promise : second.promise;
			} );
			const { result, queryClient } = renderSave();

			let saves: Promise< unknown >[] = [];
			act( () => {
				saves = [
					result.current( 'likes_enabled', false ),
					result.current( 'button_style', 'icon' ),
				];
			} );
			await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 1 ) );

			await act( async () => {
				settle( first );
				await saves[ 0 ];
			} );
			await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 2 ) );

			expect( queryClient.getQueryData< Settings >( queryKeys.settings ) ).toMatchObject( {
				likes_enabled: likesEnabled,
				button_style: 'icon',
			} );
			expect( apiCalls( 'PUT' )[ 1 ].data ).toEqual( { button_style: 'icon' } );

			await act( async () => {
				second.resolve( { ...baseSettings, likes_enabled: likesEnabled, button_style: 'icon' } );
				await saves[ 1 ];
			} );
		}
	);

	it( 'keeps a later edit of the same setting when the earlier save fails', async () => {
		const first = deferred< Settings >();
		const second = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method !== 'PUT' ) {
				return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
			}
			return apiCalls( 'PUT' ).length === 1 ? first.promise : second.promise;
		} );
		const { result, queryClient } = renderSave();

		let saves: Promise< unknown >[] = [];
		act( () => {
			saves = [
				result.current( 'button_style', 'icon' ),
				result.current( 'button_style', 'text' ),
			];
		} );
		await act( async () => {
			first.reject( { message: 'Nope.' } );
			await saves[ 0 ];
		} );

		expect( queryClient.getQueryData< Settings >( queryKeys.settings )?.button_style ).toBe(
			'text'
		);

		await act( async () => {
			second.resolve( { ...baseSettings, button_style: 'text' } );
			await saves[ 1 ];
		} );
	} );

	it( 'sends a queued save without waiting on retries of a failed status read', async () => {
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				return Promise.resolve( baseSettings );
			}
			return path?.endsWith( '/status' )
				? Promise.reject( { message: 'Offline.' } )
				: Promise.resolve( baseSettings );
		} );
		const { result } = renderSave();

		act( () => {
			result.current( 'likes_enabled', false );
			result.current( 'button_style', 'icon' );
		} );

		await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 2 ) );
	} );
} );
