import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryKeys, useStatus } from '../data/queries';
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
 * Render the save hook alongside an active status query, which is what gets refetched.
 *
 * @return Hook result and query client.
 */
function renderSave() {
	const queryClient = createTestQueryClient();
	const { result } = renderHook(
		() => {
			useStatus();
			return useSaveSetting();
		},
		{ wrapper: wrapperFor( queryClient ) }
	);
	return { result, queryClient };
}

/**
 * A promise and the function that settles it.
 *
 * @return Deferred.
 */
function deferred< T >() {
	let resolve!: ( value: T ) => void;
	const promise = new Promise< T >( r => ( resolve = r ) );
	return { promise, resolve };
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

	it( 'rolls back and shows the server message when a save fails', async () => {
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				return Promise.reject( {
					code: 'rest_sharing_likes_comment_likes_unchanged',
					message: 'Comment Likes could not be switched on or off on this site.',
				} );
			}
			return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
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

	it( "keeps a queued save's value when an earlier response lands", async () => {
		const first = deferred< Settings >();
		const second = deferred< Settings >();
		mockApiFetch.mockImplementation( ( { method, data } ) => {
			if ( method !== 'PUT' ) {
				return Promise.resolve( baseStatus );
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
			first.resolve( { ...baseSettings, likes_enabled: false } );
			await saves[ 0 ];
		} );

		expect( queryClient.getQueryData< Settings >( queryKeys.settings ) ).toMatchObject( {
			likes_enabled: false,
			button_style: 'icon',
		} );
		await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 2 ) );
		expect( apiCalls( 'PUT' )[ 1 ].data ).toEqual( { button_style: 'icon' } );

		await act( async () => {
			second.resolve( { ...baseSettings, likes_enabled: false, button_style: 'icon' } );
			await saves[ 1 ];
		} );
	} );
} );
