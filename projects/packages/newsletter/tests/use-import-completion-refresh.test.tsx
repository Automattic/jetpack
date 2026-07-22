import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useImportCompletionRefresh } from '../_inc/subscribers/data/use-import-completion-refresh';
import type { ImportJob, ImportJobStatus } from '../_inc/subscribers/data/types';

// The watcher reads its jobs through `useImportJobs`; we drive that hook's return value from this
// module-level handle so a `rerender()` simulates the next poll returning a new job status. The
// real `isJobInProgress` is kept (via requireActual) so the transition logic under test is real.
let mockJobs: ImportJob[] | undefined;

jest.mock( '../_inc/subscribers/data/use-import-jobs', () => {
	const actual = jest.requireActual( '../_inc/subscribers/data/use-import-jobs' );
	return {
		...actual,
		useImportJobs: () => ( { data: mockJobs } ),
	};
} );

const job = ( status: ImportJobStatus ): ImportJob => ( { id: 1, status } );

const renderWatcher = () => {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false } },
	} );
	const invalidateSpy = jest.spyOn( queryClient, 'invalidateQueries' );
	const wrapper = ( { children }: { children: React.ReactNode } ) => (
		<QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>
	);
	const view = renderHook( () => useImportCompletionRefresh(), { wrapper } );
	return { ...view, invalidateSpy };
};

beforeEach( () => {
	mockJobs = undefined;
} );

describe( 'useImportCompletionRefresh', () => {
	it( 'refreshes the subscribers list when a running import finishes', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		// Still running: nothing to refresh yet.
		expect( invalidateSpy ).not.toHaveBeenCalled();

		// Next poll: the job completed.
		mockJobs = [ job( 'imported' ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
	} );

	it( 'refreshes on the falling edge even when the import ends in failure', () => {
		mockJobs = [ job( 'pending' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [ job( 'failed' ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
	} );

	it( 'does not refresh on mount when a prior import is already finished', () => {
		mockJobs = [ job( 'imported' ) ];
		const { invalidateSpy } = renderWatcher();

		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not refresh while an import is still in progress', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [ job( 'importing' ) ];
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );

	it( 'does not refresh when no import ever runs', () => {
		mockJobs = [];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [];
		rerender();

		expect( invalidateSpy ).not.toHaveBeenCalled();
	} );
} );
