import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { useSaveVideoEdits, EditsConflictError } from '../use-save-video-edits';
import { EDITS_QUERY_KEY } from '../use-video-edits';
import type { SaveEditsResponse } from '../../types/edits';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

const mockedApiFetch = apiFetch as unknown as jest.Mock;

const acceptedResponse: SaveEditsResponse = {
	guid: 'abc123',
	revision: 0,
	job: {
		id: 'mock-job-1-1000',
		status: 'processing',
		target_revision: 1,
		progress: 0,
		error: null,
	},
};

/**
 * Create an isolated QueryClient, an invalidateQueries spy, and a React
 * wrapper component for renderHook.
 *
 * @return An object containing the client, wrapper component, and invalidateSpy.
 */
function makeWrapper() {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( client, 'invalidateQueries' );
	const wrapper = ( { children }: { children: ReactNode } ) =>
		createElement( QueryClientProvider, { client }, children );
	return { client, wrapper, invalidateSpy };
}

afterEach( () => {
	mockedApiFetch.mockReset();
} );

describe( 'useSaveVideoEdits — success', () => {
	it( 'POSTs base_revision and operations to the guid-scoped edits endpoint', async () => {
		mockedApiFetch.mockResolvedValueOnce( acceptedResponse );
		const { wrapper, invalidateSpy } = makeWrapper();
		const { result } = renderHook( () => useSaveVideoEdits(), { wrapper } );

		const operations = [
			{ type: 'trim' as const, start_ms: 1000, end_ms: 50000 },
			{ type: 'cut' as const, start_ms: 5000, end_ms: 8000 },
		];

		let response: SaveEditsResponse | undefined;
		await act( async () => {
			response = await result.current.mutateAsync( {
				guid: 'abc123',
				baseRevision: 0,
				operations,
			} );
		} );

		expect( mockedApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/videopress/abc123/edits',
			method: 'POST',
			data: { base_revision: 0, operations },
		} );
		expect( response ).toEqual( acceptedResponse );

		// Success re-baselines by invalidating the edits query for this guid.
		expect( invalidateSpy ).toHaveBeenCalledWith( {
			queryKey: [ EDITS_QUERY_KEY, 'abc123' ],
		} );
	} );
} );

describe( 'useSaveVideoEdits — conflict handling', () => {
	it( 'surfaces a 409 edits_conflict as a typed EditsConflictError', async () => {
		mockedApiFetch.mockRejectedValueOnce( {
			code: 'edits_conflict',
			message: 'The video was edited by someone else.',
			data: { status: 409, current_revision: 3 },
		} );
		const { wrapper, invalidateSpy } = makeWrapper();
		invalidateSpy.mockClear();
		const { result } = renderHook( () => useSaveVideoEdits(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( { guid: 'abc123', baseRevision: 0, operations: [] } );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBeInstanceOf( EditsConflictError );
		const conflict = caught as EditsConflictError;
		expect( conflict.code ).toBe( 'edits_conflict' );
		expect( conflict.message ).toBe( 'The video was edited by someone else.' );
		expect( conflict.currentRevision ).toBe( 3 );

		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );

	it( 'defaults currentRevision to null when the error data omits it', async () => {
		mockedApiFetch.mockRejectedValueOnce( { code: 'edits_conflict' } );
		const { wrapper } = makeWrapper();
		const { result } = renderHook( () => useSaveVideoEdits(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( { guid: 'abc123', baseRevision: 0, operations: [] } );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBeInstanceOf( EditsConflictError );
		expect( ( caught as EditsConflictError ).currentRevision ).toBeNull();
	} );

	it( 'rethrows non-conflict errors untouched and does not invalidate', async () => {
		const restError = { code: 'edits_invalid_operations', message: 'bad ops' };
		mockedApiFetch.mockRejectedValueOnce( restError );
		const { wrapper, invalidateSpy } = makeWrapper();
		invalidateSpy.mockClear();
		const { result } = renderHook( () => useSaveVideoEdits(), { wrapper } );

		let caught: unknown;
		await act( async () => {
			try {
				await result.current.mutateAsync( { guid: 'abc123', baseRevision: 0, operations: [] } );
			} catch ( error ) {
				caught = error;
			}
		} );

		expect( caught ).toBe( restError );
		expect( caught ).not.toBeInstanceOf( EditsConflictError );
		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );
} );
