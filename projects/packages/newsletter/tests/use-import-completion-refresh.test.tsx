import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useImportCompletionRefresh } from '../_inc/subscribers/data/use-import-completion-refresh';
import { IMPORT_IN_PROGRESS_NOTICE_ID } from '../_inc/subscribers/data/use-import-jobs';
import type { ImportJob, ImportJobStatus } from '../_inc/subscribers/data/types';

// The watcher reads its jobs through `useImportJobs`; we drive that hook's return value from this
// module-level handle so a `rerender()` simulates the next poll returning a new job status. The
// real `isJobInProgress` and `IMPORT_IN_PROGRESS_NOTICE_ID` are kept (via requireActual) so the
// transition logic and notice id under test are real.
let mockJobs: ImportJob[] | undefined;

jest.mock( '../_inc/subscribers/data/use-import-jobs', () => {
	const actual = jest.requireActual( '../_inc/subscribers/data/use-import-jobs' );
	return {
		...actual,
		useImportJobs: () => ( { data: mockJobs } ),
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
	mockCreateSuccessNotice.mockReset();
	mockCreateErrorNotice.mockReset();
	mockRemoveNotice.mockReset();
} );

describe( 'useImportCompletionRefresh', () => {
	it( 'refreshes the list and shows a success notice when an import finishes', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		// Still running: nothing to refresh yet.
		expect( invalidateSpy ).not.toHaveBeenCalled();

		// Next poll: the job completed.
		mockJobs = [ job( 'imported' ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'reports the imported count in the success notice when the job carries one', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender } = renderWatcher();
		mockJobs = [ job( 'imported', { subscribed_count: 3, failed_subscribed_count: 0 } ) ];
		rerender();

		expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateSuccessNotice.mock.calls[ 0 ][ 0 ] ).toContain( '3' );
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'warns about the shortfall when an import only partially succeeds', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender } = renderWatcher();
		// WP.com sends counts as numeric strings; the watcher must coerce them.
		mockJobs = [ job( 'imported', { subscribed_count: '8', failed_subscribed_count: '2' } ) ];
		rerender();

		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 );
		const message = mockCreateErrorNotice.mock.calls[ 0 ][ 0 ];
		expect( message ).toContain( '8' );
		expect( message ).toContain( '2' );
	} );

	it( 'shows an error notice when the import job ends in failure', () => {
		mockJobs = [ job( 'pending' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [ job( 'failed' ) ];
		rerender();

		expect( invalidateSpy ).toHaveBeenCalledWith( { queryKey: [ 'subscribers' ] } );
		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateErrorNotice ).toHaveBeenCalledTimes( 1 );
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'clears the notice but reports nothing when a stuck import is cancelled', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender } = renderWatcher();
		mockJobs = [ job( 'cancelled' ) ];
		rerender();

		expect( mockRemoveNotice ).toHaveBeenCalledWith( IMPORT_IN_PROGRESS_NOTICE_ID );
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
		expect( mockCreateErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'does nothing on mount when a prior import is already finished', () => {
		mockJobs = [ job( 'imported' ) ];
		const { invalidateSpy } = renderWatcher();

		expect( invalidateSpy ).not.toHaveBeenCalled();
		expect( mockRemoveNotice ).not.toHaveBeenCalled();
		expect( mockCreateSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'does nothing while an import is still in progress', () => {
		mockJobs = [ job( 'importing' ) ];
		const { rerender, invalidateSpy } = renderWatcher();
		mockJobs = [ job( 'importing' ) ];
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
} );
