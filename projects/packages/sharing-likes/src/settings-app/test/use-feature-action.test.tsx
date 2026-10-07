import { act, renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { queryKeys, useSettings } from '../data/queries';
import { useFeatureAction } from '../data/use-feature-action';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	createTestQueryClient,
	resetNotices,
	snackbarMessages,
	wrapperFor,
} from './helpers';
import type { Status } from '../types';

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
} );
