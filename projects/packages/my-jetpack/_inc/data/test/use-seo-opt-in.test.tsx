import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import useAnalytics from '../../hooks/use-analytics';
import { assignLocation } from '../../hooks/use-notification-watcher/assignLocation';
import useSeoOptIn from '../use-seo-opt-in';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import type { FC, ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../hooks/use-analytics' );
jest.mock( '../../hooks/use-notification-watcher/assignLocation' );
jest.mock( '../utils/get-my-jetpack-window-state' );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;
const mockUseAnalytics = useAnalytics as jest.MockedFunction< typeof useAnalytics >;
const mockAssignLocation = assignLocation as jest.MockedFunction< typeof assignLocation >;
const mockGetWindowState = getMyJetpackWindowInitialState as jest.MockedFunction<
	typeof getMyJetpackWindowInitialState
>;

const recordEvent = jest.fn();

const createWrapper = (): FC< { children: ReactNode } > => {
	const queryClient = new QueryClient( {
		defaultOptions: { mutations: { retry: false } },
	} );
	return ( { children } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
};

describe( 'useSeoOptIn', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockUseAnalytics.mockReturnValue( { recordEvent } );
		mockGetWindowState.mockReturnValue( {
			showCard: true,
			redirect: 'https://example.org/wp-admin/fallback',
		} );
	} );

	it( 'starts not pending', () => {
		const { result } = renderHook( () => useSeoOptIn(), { wrapper: createWrapper() } );

		expect( result.current.isPending ).toBe( false );
	} );

	it( 'POSTs to the opt-in endpoint and navigates to the returned redirect on success', async () => {
		mockApiFetch.mockResolvedValue( {
			success: true,
			redirect: 'https://example.org/wp-admin/admin.php?page=jetpack-seo',
		} );

		const { result } = renderHook( () => useSeoOptIn(), { wrapper: createWrapper() } );

		result.current.optIn();

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					path: 'jetpack/v4/seo/opt-in',
					method: 'POST',
				} )
			)
		);

		await waitFor( () =>
			expect( mockAssignLocation ).toHaveBeenCalledWith(
				'https://example.org/wp-admin/admin.php?page=jetpack-seo'
			)
		);
		expect( recordEvent ).toHaveBeenCalledWith( 'jetpack_myjetpack_seo_opt_in_card_success', {} );
	} );

	it( 'falls back to the bootstrapped redirect when the response has none', async () => {
		mockApiFetch.mockResolvedValue( { success: true, redirect: '' } );

		const { result } = renderHook( () => useSeoOptIn(), { wrapper: createWrapper() } );

		result.current.optIn();

		await waitFor( () =>
			expect( mockAssignLocation ).toHaveBeenCalledWith( 'https://example.org/wp-admin/fallback' )
		);
	} );

	it( 'reflects the pending state while the request is in flight', async () => {
		let resolveFetch: ( value: { success: boolean; redirect: string } ) => void;
		mockApiFetch.mockReturnValue(
			new Promise( resolve => {
				resolveFetch = resolve;
			} )
		);

		const { result } = renderHook( () => useSeoOptIn(), { wrapper: createWrapper() } );

		result.current.optIn();

		await waitFor( () => expect( result.current.isPending ).toBe( true ) );

		resolveFetch( { success: true, redirect: 'https://example.org/wp-admin/done' } );

		await waitFor( () => expect( result.current.isPending ).toBe( false ) );
	} );
} );
