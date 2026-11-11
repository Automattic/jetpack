import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
	BULK_REMOVE_QUERY_KEY,
	isBulkRemoveActive,
	useBulkRemoveCounts,
	useBulkRemoveStatus,
	useStartBulkRemoveMutation,
} from '../_inc/subscribers/data/use-bulk-remove';
import type { BulkRemoveJob } from '../_inc/subscribers/data/types';

const mockStartBulkRemove = jest.fn();
const mockFetchBulkRemoveStatus = jest.fn();
const mockFetchSubscribers = jest.fn();
const mockRecordTracksEvent = jest.fn();

jest.mock( '../_inc/subscribers/data/api', () => ( {
	startBulkRemove: ( ...args: unknown[] ) => mockStartBulkRemove( ...args ),
	fetchBulkRemoveStatus: ( ...args: unknown[] ) => mockFetchBulkRemoveStatus( ...args ),
	fetchSubscribers: ( ...args: unknown[] ) => mockFetchSubscribers( ...args ),
} ) );

jest.mock( '../_inc/subscribers/lib/tracks', () => ( {
	recordTracksEvent: ( ...args: unknown[] ) => mockRecordTracksEvent( ...args ),
} ) );

const buildJob = ( overrides: Partial< BulkRemoveJob > = {} ): BulkRemoveJob =>
	( {
		id: 7,
		blog_id: 1,
		status: 'removing',
		stalled: false,
		filters: [ 'all' ],
		search: '',
		cancel_paid: true,
		created_at: 1,
		updated_at: 2,
		finished_at: null,
		total: 100,
		processed: 40,
		removed: 40,
		failed: 0,
		skipped_paid: 0,
		counts_before: null,
		counts_after: null,
		has_backup: true,
		...overrides,
	} ) as BulkRemoveJob;

const setup = () => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	return { queryClient, wrapper };
};

beforeEach( () => {
	jest.clearAllMocks();
} );

describe( 'isBulkRemoveActive', () => {
	it( 'is true for each working status', () => {
		[ 'queued', 'backing_up', 'removing', 'finishing' ].forEach( status => {
			expect( isBulkRemoveActive( buildJob( { status } as Partial< BulkRemoveJob > ) ) ).toBe(
				true
			);
		} );
	} );

	it( 'is false for a finished, failed or stalled job, and for none', () => {
		expect( isBulkRemoveActive( buildJob( { status: 'done' } ) ) ).toBe( false );
		expect( isBulkRemoveActive( buildJob( { status: 'failed' } ) ) ).toBe( false );
		expect( isBulkRemoveActive( buildJob( { stalled: true } ) ) ).toBe( false );
		expect( isBulkRemoveActive( null ) ).toBe( false );
	} );
} );

describe( 'useStartBulkRemoveMutation', () => {
	it( 'sends the whole list for Remove all, whatever the table shows', async () => {
		mockStartBulkRemove.mockResolvedValue( { job: buildJob( { status: 'queued' } ) } );
		const { queryClient, wrapper } = setup();
		const { result } = renderHook( () => useStartBulkRemoveMutation(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				scope: 'all',
				filters: [ 'free' ],
				search: 'gmail',
				expectedCount: 100,
			} );
		} );

		expect( mockStartBulkRemove ).toHaveBeenCalledWith( {
			filters: [ 'all' ],
			search: '',
			expectedCount: 100,
		} );
		expect( queryClient.getQueryData( BULK_REMOVE_QUERY_KEY ) ).toMatchObject( {
			id: 7,
			status: 'queued',
		} );
	} );

	it( 'sends the filters and search for Remove matching', async () => {
		mockStartBulkRemove.mockResolvedValue( { job: buildJob() } );
		const { wrapper } = setup();
		const { result } = renderHook( () => useStartBulkRemoveMutation(), { wrapper } );

		await act( async () => {
			await result.current.mutateAsync( {
				scope: 'matching',
				filters: [ 'free' ],
				search: 'gmail',
				expectedCount: 12,
			} );
		} );

		expect( mockStartBulkRemove ).toHaveBeenCalledWith( {
			filters: [ 'free' ],
			search: 'gmail',
			expectedCount: 12,
		} );
	} );

	it( 'shows the removal that is already running when the start is refused', async () => {
		const running = buildJob( { id: 9 } );
		mockStartBulkRemove.mockRejectedValue( {
			code: 'bulk_remove_in_progress',
			data: { status: 409, job: running },
		} );
		const { queryClient, wrapper } = setup();
		const { result } = renderHook( () => useStartBulkRemoveMutation(), { wrapper } );

		await act( async () => {
			await result.current
				.mutateAsync( { scope: 'all', filters: [], search: '', expectedCount: 1 } )
				.catch( () => undefined );
		} );

		expect( queryClient.getQueryData( BULK_REMOVE_QUERY_KEY ) ).toMatchObject( { id: 9 } );
	} );
} );

describe( 'useBulkRemoveStatus', () => {
	it( 'refreshes the list and records the finish once a running job is done', async () => {
		mockFetchBulkRemoveStatus.mockResolvedValue( { job: buildJob() } );
		const { queryClient, wrapper } = setup();
		const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
		const { result } = renderHook( () => useBulkRemoveStatus( true ), { wrapper } );

		await waitFor( () => expect( result.current.isActive ).toBe( true ) );
		expect( invalidateSpy ).not.toHaveBeenCalled();

		act( () => {
			queryClient.setQueryData(
				BULK_REMOVE_QUERY_KEY,
				buildJob( { status: 'done', processed: 100, removed: 100, finished_at: 3 } )
			);
		} );

		await waitFor( () =>
			expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } )
		);
		expect( mockRecordTracksEvent ).toHaveBeenCalledWith(
			'jetpack_subscribers_bulk_remove_finished',
			expect.objectContaining( { job_id: 7, status: 'done', removed: 100 } )
		);
	} );

	it( 'does not refresh for a job that was already finished on load', async () => {
		mockFetchBulkRemoveStatus.mockResolvedValue( { job: buildJob( { status: 'done' } ) } );
		const { queryClient, wrapper } = setup();
		const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
		const { result } = renderHook( () => useBulkRemoveStatus( true ), { wrapper } );

		await waitFor( () => expect( result.current.job?.status ).toBe( 'done' ) );
		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRecordTracksEvent ).not.toHaveBeenCalled();
	} );

	it( 'fetches nothing when disabled', () => {
		const { wrapper } = setup();
		renderHook( () => useBulkRemoveStatus( false ), { wrapper } );

		expect( mockFetchBulkRemoveStatus ).not.toHaveBeenCalled();
	} );
} );

describe( 'useBulkRemoveCounts', () => {
	it( 'counts the matches and the paid matches with one-row requests', async () => {
		mockFetchSubscribers.mockImplementation( ( { filters } ) =>
			Promise.resolve( { total: filters.includes( 'paid' ) ? 3 : 120 } )
		);
		const { wrapper } = setup();
		const { result } = renderHook(
			() => useBulkRemoveCounts( { filters: [ 'free' ], search: 'gmail', enabled: true } ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.data ).toEqual( { total: 120, paid: 3 } ) );
		expect( mockFetchSubscribers ).toHaveBeenCalledWith(
			expect.objectContaining( { perPage: 1, filters: [ 'free' ], search: 'gmail' } )
		);
		expect( mockFetchSubscribers ).toHaveBeenCalledWith(
			expect.objectContaining( { perPage: 1, filters: [ 'free', 'paid' ], search: 'gmail' } )
		);
	} );

	it( 'skips the second request when the filter is already paid', async () => {
		mockFetchSubscribers.mockResolvedValue( { total: 4 } );
		const { wrapper } = setup();
		const { result } = renderHook(
			() => useBulkRemoveCounts( { filters: [ 'paid' ], search: '', enabled: true } ),
			{ wrapper }
		);

		await waitFor( () => expect( result.current.data ).toEqual( { total: 4, paid: 4 } ) );
		expect( mockFetchSubscribers ).toHaveBeenCalledTimes( 1 );
	} );
} );
