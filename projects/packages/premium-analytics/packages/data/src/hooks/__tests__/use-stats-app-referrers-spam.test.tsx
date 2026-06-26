/**
 * External dependencies
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import {
	useStatsAppReferrersMarkSpamMutation,
	useStatsAppReferrersUnmarkSpamMutation,
} from '../use-stats-app-referrers-spam';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

function wrapper( { children }: { children: ReactNode } ) {
	const queryClient = new QueryClient( {
		defaultOptions: {
			mutations: {
				retry: false,
			},
			queries: {
				retry: false,
			},
		},
	} );

	return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
}

beforeEach( () => {
	mockApiFetch.mockResolvedValue( { success: true } );
} );

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'useStatsAppReferrersSpam mutations', () => {
	it( 'marks a referrer as spam with the expected domain query param', async () => {
		const { result } = renderHook( () => useStatsAppReferrersMarkSpamMutation(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( { domain: 'spam.example' } );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/referrers/spam/new?domain=spam.example',
			method: 'POST',
			data: undefined,
		} );
	} );

	it( 'unmarks a referrer as spam with the expected domain query param', async () => {
		const { result } = renderHook( () => useStatsAppReferrersUnmarkSpamMutation(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( { domain: 'spam.example' } );
		} );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack-premium-analytics/v1/proxy/v1.1/stats/referrers/spam/delete?domain=spam.example',
			method: 'POST',
			data: undefined,
		} );
	} );
} );
