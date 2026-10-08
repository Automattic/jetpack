import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryKeys, useSettings, useStatus } from '../data/queries';
import { useFeatureAction } from '../data/use-feature-action';
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
import type { Settings, Status } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const switched: Status = { ...baseStatus, sharing: { state: 'block_call_to_action' } };

/**
 * Render the action hook alongside an active settings query, which is what gets refetched.
 *
 * @return Hook result and query client.
 */
function renderAction() {
	const queryClient = createTestQueryClient();
	const { result } = renderHook(
		() => {
			useSettings();
			return useFeatureAction();
		},
		{ wrapper: wrapperFor( queryClient ) }
	);
	return { result, queryClient };
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
} );

describe( 'useFeatureAction', () => {
	it( 're-renders from the returned status and reads settings again', async () => {
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'POST' ? switched : baseSettings )
		);
		const { result, queryClient } = renderAction();

		act( () => result.current.run( 'sharing', 'switch-to-block' ) );

		await waitFor( () =>
			expect( queryClient.getQueryData< Status >( queryKeys.status )?.sharing.state ).toBe(
				'block_call_to_action'
			)
		);
		expect( apiCalls( 'POST' ) ).toEqual( [
			{ path: '/wpcom/v2/sharing-likes/sharing/switch-to-block', method: 'POST' },
		] );
		await waitFor( () =>
			expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/settings' } )
		);
	} );

	it( 'shows the server message when the action is refused', async () => {
		mockApiFetch.mockImplementation( ( { method } ) =>
			method === 'POST'
				? Promise.reject( { message: 'The feature could not be turned on.' } )
				: Promise.resolve( baseStatus )
		);
		const { result } = renderAction();

		act( () => result.current.run( 'likes', 'activate' ) );

		await waitFor( () =>
			expect( snackbarMessages() ).toContain( 'The feature could not be turned on.' )
		);
	} );
	it( "lets a refused action's status read finish before the next action runs", async () => {
		let resolveStatus!: ( value: Status ) => void;
		const statusRead = new Promise< Status >( resolve => ( resolveStatus = resolve ) );
		mockApiFetch.mockImplementation( ( { path, method } ) => {
			if ( method === 'POST' ) {
				return path?.includes( 'likes/activate' )
					? Promise.reject( { message: 'Refused.' } )
					: Promise.resolve( switched );
			}
			return path?.endsWith( '/status' ) ? statusRead : Promise.resolve( baseSettings );
		} );
		const queryClient = createTestQueryClient();
		const { result } = renderHook(
			() => {
				useStatus();
				return useFeatureAction();
			},
			{ wrapper: wrapperFor( queryClient ) }
		);

		act( () => {
			result.current.run( 'likes', 'activate' );
			result.current.run( 'sharing', 'switch-to-block' );
		} );
		await waitFor( () =>
			expect( apiCalls() ).toContainEqual( { path: '/wpcom/v2/sharing-likes/status' } )
		);
		expect( apiCalls( 'POST' ) ).toHaveLength( 1 );

		await act( async () => resolveStatus( baseStatus ) );

		await waitFor( () =>
			expect( queryClient.getQueryData< Status >( queryKeys.status )?.sharing.state ).toBe(
				'block_call_to_action'
			)
		);
	} );

	it( "keeps a save's value when the action before it reads settings again", async () => {
		let resolvePut!: ( value: Settings ) => void;
		const put = new Promise< Settings >( resolve => ( resolvePut = resolve ) );
		mockApiFetch.mockImplementation( ( { method } ) => {
			if ( method === 'POST' ) {
				return Promise.resolve( switched );
			}
			return method === 'PUT' ? put : Promise.resolve( baseSettings );
		} );
		const queryClient = createTestQueryClient();
		const { result } = renderHook(
			() => {
				useSettings();
				return { action: useFeatureAction(), save: useSaveSetting() };
			},
			{ wrapper: wrapperFor( queryClient ) }
		);

		let saved: Promise< unknown > = Promise.resolve();
		act( () => {
			result.current.action.run( 'sharing', 'switch-to-block' );
			saved = result.current.save( 'button_style', 'icon' );
		} );
		await waitFor( () => expect( apiCalls( 'PUT' ) ).toHaveLength( 1 ) );

		expect( queryClient.getQueryData< Settings >( queryKeys.settings ) ).toMatchObject( {
			button_style: 'icon',
		} );

		await act( async () => {
			resolvePut( { ...baseSettings, button_style: 'icon' } );
			await saved;
		} );
	} );
} );
