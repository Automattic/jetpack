import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { useRestoreOriginal } from '../use-restore-original';
import { EDITS_QUERY_KEY } from '../use-video-edits';
import type { SaveEditsResponse } from '../../types/edits';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const acceptedResponse: SaveEditsResponse = {
	guid: 'abc123',
	revision: 2,
	job: {
		id: 'mock-job-3-1000',
		status: 'processing',
		target_revision: 3,
		progress: 0,
		error: null,
	},
};

/**
 * Create an isolated QueryClient, an invalidateQueries spy, and a React
 * wrapper component for renderHook.
 *
 * @return An object containing the wrapper component and invalidateSpy.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { wrapper, invalidateSpy };
}

afterEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useRestoreOriginal', () => {
	it( 'DELETEs the guid-scoped edits endpoint and invalidates the edits query', async () => {
		mockedApiFetch.mockResolvedValueOnce( acceptedResponse );
		const { wrapper, invalidateSpy } = makeWrapper();
		const { result } = renderHook( () => useRestoreOriginal(), { wrapper } );

		let response: SaveEditsResponse | undefined;
		await act( async () => {
			response = await result.current.mutateAsync( { guid: 'abc123' } );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/edits',
			method: 'DELETE',
		} );
		expect( response ).toEqual( acceptedResponse );
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ EDITS_QUERY_KEY, 'abc123' ],
		} );
	} );

	it( 'rejects and does not invalidate on API error', async () => {
		const restError = { code: 'edits_job_in_progress', message: 'busy' };
		mockedApiFetch.mockRejectedValueOnce( restError );
		const { wrapper, invalidateSpy } = makeWrapper();
		invalidateSpy.mockClear();
		const { result } = renderHook( () => useRestoreOriginal(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( { guid: 'abc123' } );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBe( restError );
		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );
} );
