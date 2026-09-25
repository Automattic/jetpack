import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { act, renderHook } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { useRestoreOriginal } from '../../../hooks/use-restore-original';
import { EditsConflictError, useSaveVideoEdits } from '../../../hooks/use-save-video-edits';
import { useVideoEdits } from '../../../hooks/use-video-edits';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import { useEditSession } from '../use-edit-session';
import type { VideoEdits } from '../../../types/edits';

jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: jest.fn(),
} ) );
jest.mock( '../../../hooks/use-video-edits', () => ( { useVideoEdits: jest.fn() } ) );
jest.mock( '../../../hooks/use-restore-original', () => ( { useRestoreOriginal: jest.fn() } ) );
jest.mock( '../../../hooks/use-save-video-edits', () => ( {
	...jest.requireActual( '../../../hooks/use-save-video-edits' ),
	useSaveVideoEdits: jest.fn(),
} ) );

const video = makeLibraryItem( { guid: 'clip123', durationSeconds: 10 } );
const save = jest.fn();
const restore = jest.fn();
const refetch = jest.fn();
const successNotice = jest.fn();
const errorNotice = jest.fn();
let edits: VideoEdits;

/**
 * Update the server state returned by the edits query.
 *
 * @param next - The latest server state.
 */
function setEdits( next: VideoEdits ) {
	edits = next;
	jest.mocked( useVideoEdits ).mockReturnValue( {
		edits,
		isLoading: false,
		isError: false,
		error: null,
		refetch,
	} as never );
}

beforeEach( () => {
	jest.clearAllMocks();
	setEdits( {
		guid: video.guid,
		revision: 2,
		original_duration_ms: 10000,
		output_duration_ms: 10000,
		operations: [],
		can_restore_original: false,
		job: { id: null, status: 'idle', target_revision: null, progress: null, error: null },
		updated: '2026-09-20T00:00:00Z',
	} );
	jest.mocked( useGlobalNotices ).mockReturnValue( {
		createSuccessNotice: successNotice,
		createErrorNotice: errorNotice,
	} as never );
	jest.mocked( useSaveVideoEdits ).mockReturnValue( { mutateAsync: save } as never );
	jest.mocked( useRestoreOriginal ).mockReturnValue( { mutateAsync: restore } as never );
	save.mockResolvedValue( {
		guid: video.guid,
		revision: 2,
		job: { ...edits.job, id: 'job-3', status: 'processing', target_revision: 3 },
	} );
	restore.mockImplementation( save );
} );

/**
 * Render a session with an isolated query cache.
 *
 * @return The session hook result.
 */
function renderSession() {
	return renderHook( () => useEditSession( video ), { wrapper: createTestWrapper() } );
}

/**
 * Trim both ends of the loaded original.
 *
 * @param result - The session hook result.
 */
function trim( result: ReturnType< typeof renderSession >[ 'result' ] ) {
	act( () => {
		result.current.dispatch( { type: 'SET_TRIM_START', ms: 1000 } );
		result.current.dispatch( { type: 'SET_TRIM_END', ms: 9000 } );
	} );
}

describe( 'useEditSession', () => {
	it( 'keeps local edits dirty and locked until the accepted job commits', async () => {
		const { result, rerender } = renderSession();
		trim( result );
		await act( async () => result.current.submit() );
		expect( save ).toHaveBeenCalledWith( {
			guid: video.guid,
			baseRevision: 2,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ],
		} );
		expect( result.current.dirty ).toBe( true );
		expect( result.current.locked ).toBe( true );
		expect( successNotice ).not.toHaveBeenCalled();
		setEdits( {
			...edits,
			revision: 3,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ],
			job: { ...edits.job, id: 'job-3', status: 'complete', target_revision: 3 },
		} );
		rerender();
		expect( result.current.dirty ).toBe( false );
		expect( result.current.locked ).toBe( false );
		expect( result.current.history.past ).toHaveLength( 0 );
		expect( successNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'handles completion once when publishing a notice synchronously updates an external store', async () => {
		let version = 0;
		const listeners = new Set< () => void >();
		const subscribe = ( notify: () => void ) => {
			listeners.add( notify );
			return () => {
				listeners.delete( notify );
			};
		};
		jest.mocked( useGlobalNotices ).mockImplementation( () => {
			useSyncExternalStore( subscribe, () => version );
			return {
				createErrorNotice: errorNotice,
				createSuccessNotice: ( message: string ) => {
					successNotice( message );
					version++;
					listeners.forEach( notify => notify() );
				},
			} as never;
		} );
		const { result, rerender } = renderSession();
		trim( result );
		await act( async () => result.current.submit() );
		setEdits( {
			...edits,
			revision: 3,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ],
			job: { ...edits.job, id: 'job-3', status: 'complete', target_revision: 3 },
		} );
		rerender();
		setEdits( { ...edits } );
		rerender();
		expect( successNotice ).toHaveBeenCalledTimes( 1 );
		expect( result.current.baseline?.revision ).toBe( 3 );
		expect( result.current.dirty ).toBe( false );
		expect( result.current.locked ).toBe( false );
		trim( result );
		expect( successNotice ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'preserves edits and releases the lock when a processing job fails', async () => {
		const { result, rerender } = renderSession();
		trim( result );
		await act( async () => result.current.submit() );
		setEdits( {
			...edits,
			job: {
				...edits.job,
				id: 'job-3',
				status: 'failed',
				error: { code: 'transcode', message: 'Failed' },
			},
		} );
		rerender();
		expect( result.current.dirty ).toBe( true );
		expect( result.current.locked ).toBe( false );
		expect( result.current.session.trimStartMs ).toBe( 1000 );
		await act( async () => result.current.submit() );
		expect( save ).toHaveBeenCalledTimes( 2 );
		expect( successNotice ).not.toHaveBeenCalled();
	} );

	it( 'keeps restore as the retry action after its job fails', async () => {
		setEdits( {
			...edits,
			operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ],
			can_restore_original: true,
		} );
		const { result, rerender } = renderSession();
		await act( async () => result.current.submit( true ) );
		setEdits( { ...edits, job: { ...edits.job, id: 'job-3', status: 'failed' } } );
		rerender();
		expect( result.current.lastAction ).toBe( 'restore' );
		expect( result.current.dirty ).toBe( false );
		expect( result.current.locked ).toBe( false );
		await act( async () => result.current.submit( result.current.lastAction === 'restore' ) );
		expect( restore ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'preserves local edits when a different revision arrives', async () => {
		const { result, rerender } = renderSession();
		trim( result );
		setEdits( {
			...edits,
			revision: 3,
			operations: [ { type: 'trim', start_ms: 2000, end_ms: 8000 } ],
		} );
		rerender();
		expect( result.current.conflict ).toBe( true );
		expect( result.current.session.trimStartMs ).toBe( 1000 );
		await act( async () => result.current.submit() );
		expect( save ).not.toHaveBeenCalled();
		refetch.mockResolvedValue( { data: edits } );
		await act( async () => result.current.reload() );
		expect( result.current.conflict ).toBe( false );
		expect( result.current.dirty ).toBe( false );
		expect( result.current.session.trimStartMs ).toBe( 2000 );
	} );

	it( 'treats a rejected stale revision as a conflict rather than overwriting it', async () => {
		save.mockRejectedValue( new EditsConflictError() );
		const { result } = renderSession();
		trim( result );
		await act( async () => result.current.submit() );
		expect( result.current.conflict ).toBe( true );
		expect( result.current.dirty ).toBe( true );
		expect( result.current.locked ).toBe( false );
		expect( errorNotice ).not.toHaveBeenCalled();
	} );

	it( 'prevents duplicate submissions before React commits the pending state', async () => {
		const { result } = renderSession();
		trim( result );
		await act( async () => {
			await Promise.all( [ result.current.submit(), result.current.submit() ] );
		} );
		expect( save ).toHaveBeenCalledTimes( 1 );
	} );
} );
