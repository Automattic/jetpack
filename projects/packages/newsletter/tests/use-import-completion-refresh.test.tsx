import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import {
	describeImportOutcome,
	useImportCompletionRefresh,
} from '../_inc/subscribers/data/use-import-completion-refresh';
import { IMPORT_IN_PROGRESS_NOTICE_ID } from '../_inc/subscribers/data/use-import-jobs';
import type { ImportJob, ImportJobStatus } from '../_inc/subscribers/data/types';

// The watcher reads its jobs through `useImportJobs`; we drive that hook's return value from this
// module-level handle so a `rerender()` simulates the next poll returning a new job status. The
// real `isJobInProgress` and `IMPORT_IN_PROGRESS_NOTICE_ID` are kept (via requireActual) so the
// transition logic and notice id under test are real. The mock honours `enabled` (returning no data
// when disabled) so the gating path is exercised, mirroring the real query.
let mockJobs: ImportJob[] | undefined;

jest.mock( '../_inc/subscribers/data/use-import-jobs', () => {
	const actual = jest.requireActual( '../_inc/subscribers/data/use-import-jobs' );
	return {
		...actual,
		useImportJobs: ( enabled: boolean ) => ( { data: enabled ? mockJobs : undefined } ),
	};
} );

const mockCreateSuccessNotice = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockRemoveNotice = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		createSuccessNotice: mockCreateSuccessNotice,
		createErrorNotice: mockCreateErrorNotice,
		removeNotice: mockRemoveNotice,
	} ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

const job = ( status: ImportJobStatus, overrides: Partial< ImportJob > = {} ): ImportJob => ( {
	id: 1,
	status,
	...overrides,
} );

const renderWatcher = ( enabled = true ) => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	const view = renderHook( () => useImportCompletionRefresh( enabled ), { wrapper } );
	return { ...view, invalidateSpy };
};

beforeEach( () => {
	mockJobs = undefined;
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
	mockRemoveNotice.mockReset();
} );

describe( 'describeImportOutcome', () => {
	it( 'reports a failed job as an error pointing at the confirmation email', () => {
		const outcome = describeImportOutcome( job( 'failed' ) );
		expect( outcome?.status ).toBe( 'error' );
		expect( outcome?.message ).toContain( 'confirmation email' );
	} );

	it( 'reports the imported count on a clean success', () => {
		const outcome = describeImportOutcome( job( 'imported', { subscribed_count: 3 } ) );
		expect( outcome?.status ).toBe( 'success' );
		expect( outcome?.message ).toContain( '3' );
	} );

	it( 'reports both counts as a success caveat on a partial import', () => {
		const outcome = describeImportOutcome(
			job( 'imported', { subscribed_count: 8, failed_subscribed_count: 2 } )
		);
		expect( outcome?.status ).toBe( 'success' );
		expect( outcome?.message ).toContain( '8' );
		expect( outcome?.message ).toContain( '2' );
		expect( outcome?.message ).toContain( 'couldn’t be added' );
	} );

	it( 'stays grammatical when the imported and failed counts differ in plurality', () => {
		// 1 imported (singular) + 2 failed (plural): a single _n can only agree with one count, so
		// the failed clause must not carry a count-sensitive noun.
		const outcome = describeImportOutcome(
			job( 'imported', { subscribed_count: 1, failed_subscribed_count: 2 } )
		);
		expect( outcome?.message ).toContain( 'Imported 1 subscriber.' );
		expect( outcome?.message ).toContain( '2 couldn’t be added' );
		expect( outcome?.message ).not.toContain( 'email address' );
	} );

	it( 'accounts for both counts on a mixed new + already-subscribed import', () => {
		const outcome = describeImportOutcome(
			job( 'imported', { subscribed_count: 3, already_subscribed_count: 2 } )
		);
		expect( outcome?.status ).toBe( 'success' );
		expect( outcome?.message ).toContain( '3' );
		expect( outcome?.message ).toContain( '2' );
		expect( outcome?.message ).toContain( 'already subscribed' );
	} );

	it( 'distinguishes an already-subscribed no-op from a real import', () => {
		const outcome = describeImportOutcome(
			job( 'imported', { subscribed_count: 0, already_subscribed_count: 2 } )
		);
		expect( outcome?.status ).toBe( 'success' );
		expect( outcome?.message ).toContain( 'already subscribed' );
		expect( outcome?.message ).toContain( '2' );
	} );

	it( 'coerces WP.com numeric-string counts', () => {
		const outcome = describeImportOutcome( job( 'imported', { subscribed_count: '4' } ) );
		expect( outcome?.message ).toContain( '4' );
	} );

	it( 'falls back to a generic success when no counts are present', () => {
		const outcome = describeImportOutcome( job( 'imported' ) );
		expect( outcome?.status ).toBe( 'success' );
		expect( outcome?.message ).toContain( 'imported' );
	} );

	it( 'stays silent for cancelled and still-running jobs', () => {
		expect( describeImportOutcome( job( 'cancelled' ) ) ).toBeNull();
		expect( describeImportOutcome( job( 'pending' ) ) ).toBeNull();
	} );
} );

describe( 'useImportCompletionRefresh', () => {
	it( 'announces an import that finishes after being seen in progress', () => {
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher();

		mockJobs = [ job( 'importing', { id: 2 } ) ];
		rerender();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();

		mockJobs = [ job( 'imported', { id: 2, subscribed_count: 1 } ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'announces an instant import that was never observed running', () => {
		// The bug this fixes: a tiny / already-subscribed import can finish before any poll sees it
		// "in progress", so a transition-based watcher would never fire. Id-based detection does.
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher();

		mockJobs = [ job( 'imported', { id: 7, subscribed_count: 1 } ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'reports an already-subscribed instant import', () => {
		mockJobs = [];
		const { rerender } = renderWatcher();

		mockJobs = [ job( 'imported', { id: 8, subscribed_count: 0, already_subscribed_count: 1 } ) ];
		rerender();

		expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateSuccessNotice.mock.calls[ 0 ][ 0 ] ).toContain( 'already subscribed' );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'shows an error notice when the import job ends in failure', () => {
		mockJobs = [];
		const { rerender } = renderWatcher();

		mockJobs = [ job( 'failed', { id: 9 } ) ];
		rerender();

		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'clears the notice but reports nothing when a stuck import is cancelled', () => {
		mockJobs = [];
		const { rerender } = renderWatcher();

		mockJobs = [ job( 'cancelled', { id: 10 } ) ];
		rerender();

		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'does not re-announce imports that were already finished when the dashboard loaded', () => {
		mockJobs = [ job( 'imported', { id: 1, subscribed_count: 5 } ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'does nothing while an import is still in progress', () => {
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher();

		mockJobs = [ job( 'importing', { id: 3 } ) ];
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).not.toHaveBeenCalled();
	} );

	it( 'does nothing when no import ever runs', () => {
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [];
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).not.toHaveBeenCalled();
	} );

	it( 'stays inert when disabled, even if an import finishes', () => {
		// Gated visitors (Settings tab, connection-gated, Settings-only sites) pass `enabled=false`,
		// which withholds the poll entirely — so a finished job must not invalidate or announce.
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher( false );

		mockJobs = [ job( 'imported', { id: 11, subscribed_count: 1 } ) ];
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );
} );
