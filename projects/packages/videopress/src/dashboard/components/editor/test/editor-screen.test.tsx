/* eslint-disable testing-library/prefer-user-event -- Media, browser navigation, and document shortcuts need native events. */
import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import { useRestoreOriginal } from '../../../hooks/use-restore-original';
import { useRetryVideoProcessing } from '../../../hooks/use-retry-video-processing';
import {
	useSaveVideoCopy,
	useVideoCopyStatus,
	VideoCopyRejectedError,
} from '../../../hooks/use-save-video-copy';
import { EditsConflictError, useSaveVideoEdits } from '../../../hooks/use-save-video-edits';
import { useVideoEdits } from '../../../hooks/use-video-edits';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import TrimCutEditor from '../editor-screen';
import type { SaveVideoCopyResponse } from '../../../hooks/use-save-video-copy';
import type { EditsJob, VideoEdits } from '../../../types/edits';
import type { ReactNode } from 'react';

jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: jest.fn(),
} ) );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, actions, children }: Record< string, ReactNode > ) => (
		<>
			{ breadcrumbs }
			{ actions }
			{ children }
		</>
	),
} ) );
jest.mock( '@automattic/jetpack-connection/use-connection-error-notice', () => ( {
	__esModule: true,
	default: () => ( { hasConnectionError: false } ),
} ) );
jest.mock( '@wordpress/route', () => ( {
	useNavigate: jest.fn(),
	Link: ( { to, children }: { to: string; children: ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );
jest.mock( '../../../utils/chapters-editor', () => ( { isChaptersEditorEnabled: () => true } ) );
jest.mock( '../../../utils/trim-cut', () => ( { isTrimCutEnabled: () => true } ) );
jest.mock( '../../../hooks/use-filmstrip', () => ( {
	__esModule: true,
	default: () => ( { status: 'unavailable' } ),
} ) );
jest.mock( '../../../hooks/use-video-edits', () => ( { useVideoEdits: jest.fn() } ) );
jest.mock( '../../../hooks/use-retry-video-processing', () => ( {
	useRetryVideoProcessing: jest.fn(),
} ) );
jest.mock( '../../../hooks/use-restore-original', () => ( { useRestoreOriginal: jest.fn() } ) );
jest.mock( '../../../hooks/use-save-video-edits', () => ( {
	...jest.requireActual( '../../../hooks/use-save-video-edits' ),
	useSaveVideoEdits: jest.fn(),
} ) );
jest.mock( '../../../hooks/use-save-video-copy', () => ( {
	...jest.requireActual( '../../../hooks/use-save-video-copy' ),
	useSaveVideoCopy: jest.fn(),
	useVideoCopyStatus: jest.fn(),
} ) );
jest.mock( '../create-copy-request-id', () => ( {
	createCopyRequestId: () => '8b3d1700-1234-4567-89ab-123456789abc',
} ) );
jest.mock( '../preview/preview-player', () => {
	const { forwardRef, useImperativeHandle } = jest.requireActual( 'react' );
	return {
		__esModule: true,
		default: forwardRef( ( { onSourceReadyChange, onDurationChange, processing }, ref ) => {
			useImperativeHandle( ref, () => ( {
				seekTo: jest.fn(),
				play: jest.fn(),
				pause: jest.fn(),
				togglePlay: jest.fn(),
				isPlaying: () => false,
			} ) );
			if ( processing ) {
				return <div role="status">Video processing placeholder</div>;
			}
			return (
				<video
					aria-label="Original video preview"
					onLoadedMetadata={ event => {
						onDurationChange( event.currentTarget.duration * 1000 );
						onSourceReadyChange( true );
					} }
					onError={ () => onSourceReadyChange( false ) }
				>
					<track kind="captions" />
				</video>
			);
		} ),
	};
} );

const video = makeLibraryItem( { guid: 'clip123', durationSeconds: 10 } );
const save = jest.fn();
const restore = jest.fn();
const retryProcessing = jest.fn();
const copy = jest.fn();
const refetch = jest.fn();
const refetchCopy = jest.fn();
const navigate = jest.fn();
const successNotice = jest.fn();
const errorNotice = jest.fn();
const selectTool = jest.fn();
const idleJob: EditsJob = {
	id: null,
	status: 'idle',
	target_revision: null,
	progress: null,
	error: null,
};
const processingJob: EditsJob = {
	...idleJob,
	id: 'job-3',
	status: 'processing',
	target_revision: 3,
};
let edits: VideoEdits;
let confirmNavigation: jest.SpyInstance;

/**
 * Supply a new server snapshot without replacing the mounted editor.
 *
 * @param changes - Changed server fields.
 */
function setEdits( changes: Partial< VideoEdits > = {} ) {
	edits = { ...edits, ...changes };
	jest.mocked( useVideoEdits ).mockReturnValue( {
		edits,
		isLoading: false,
		isError: false,
		error: null,
		refetch,
	} as never );
	refetch.mockResolvedValue( { data: edits } );
}

/**
 * Supply the separately polled copy job.
 *
 * @param data    - Copy response, if the request can be found.
 * @param isError - Whether polling failed.
 */
function setCopyStatus( data?: SaveVideoCopyResponse, isError = false ) {
	jest.mocked( useVideoCopyStatus ).mockReturnValue( {
		data,
		isError,
		refetch: refetchCopy,
	} as never );
}

/**
 * Report the original video's metadata through the media boundary.
 *
 * @param duration - Original duration in seconds.
 */
function loadOriginal( duration = 10 ) {
	const preview = screen.getByLabelText( 'Original video preview' );
	Object.defineProperty( preview, 'duration', { configurable: true, value: duration } );
	fireEvent.loadedMetadata( preview );
}

/**
 * Mount the real screen and session hooks with an isolated query cache.
 *
 * @param ready - Whether the source metadata is available immediately.
 * @return Render helpers and a user interaction controller.
 */
function renderEditor( ready = true ) {
	const view = render( <TrimCutEditor video={ video } onSelectTool={ selectTool } />, {
		wrapper: createTestWrapper(),
	} );
	if ( ready ) {
		loadOriginal();
	}
	return {
		...view,
		user: userEvent.setup(),
		refresh: () => view.rerender( <TrimCutEditor video={ video } onSelectTool={ selectTool } /> ),
	};
}

/**
 * Submit a copy using the actual timeline and save dialog.
 *
 * @param user - User interaction controller.
 */
async function saveCopy( user: ReturnType< typeof userEvent.setup > ) {
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'radio', { name: 'Save as new video' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save as new video' } ) );
}

/**
 * Build a polled response for the submitted copy request.
 *
 * @param job - Current copy job.
 * @return The source and destination copy identifiers.
 */
function copyResponse( job: EditsJob = processingJob ): SaveVideoCopyResponse {
	return {
		source_guid: video.guid,
		request_id: copy.mock.calls[ 0 ][ 0 ].requestId,
		guid: null,
		attachment_id: null,
		job,
	};
}

beforeEach( () => {
	sessionStorage.clear();
	jest.clearAllMocks();
	confirmNavigation = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
	jest.mocked( useNavigate ).mockReturnValue( navigate );
	jest.mocked( useGlobalNotices ).mockReturnValue( {
		createSuccessNotice: successNotice,
		createErrorNotice: errorNotice,
	} as never );
	setEdits( {
		guid: video.guid,
		revision: 2,
		original_duration_ms: 10000,
		output_duration_ms: 10000,
		operations: [],
		can_restore_original: false,
		can_retry: false,
		job: idleJob,
		updated: '2026-09-20T00:00:00Z',
	} );
	setCopyStatus();
	jest.mocked( useSaveVideoEdits ).mockReturnValue( { mutateAsync: save } as never );
	jest
		.mocked( useRetryVideoProcessing )
		.mockReturnValue( { mutateAsync: retryProcessing } as never );
	retryProcessing.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
	jest.mocked( useRestoreOriginal ).mockReturnValue( { mutateAsync: restore } as never );
	jest.mocked( useSaveVideoCopy ).mockReturnValue( { mutateAsync: copy } as never );
	save.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
	restore.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
	copy.mockResolvedValue( undefined );
} );

afterEach( () => {
	confirmNavigation.mockRestore();
} );

it( 'waits for the original, then connects timeline edits, undo, redo, and discard', async () => {
	const { user } = renderEditor( false );
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	loadOriginal();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Redo' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Discard changes' } ) );
	await user.click(
		within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Cancel' } )
	);
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Discard changes' } ) );
	await user.click(
		within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Discard changes' } )
	);
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'Redo' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( save ).not.toHaveBeenCalled();
} );

it( 'submits the current edits against their loaded revision and waits for the committed job', async () => {
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	expect( save ).toHaveBeenCalledWith( {
		guid: video.guid,
		baseRevision: 2,
		operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
	} );
	expect( copy ).not.toHaveBeenCalled();
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	setEdits( { job: { ...processingJob, progress: 0.4 } } );
	refresh();
	expect(
		screen.getByText( 'Applying edits', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'progressbar' ) ).toHaveValue( 40 );
	expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();
	setEdits( {
		revision: 3,
		operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
		job: { ...processingJob, status: 'complete' },
	} );
	refresh();
	expect( successNotice ).toHaveBeenCalledWith( 'Video edits applied.' );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'retries the stored failed restore without issuing another restore request', async () => {
	setEdits( {
		can_restore_original: true,
		operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ],
	} );
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'More actions' } ) );
	await user.click( screen.getByRole( 'menuitem', { name: 'Restore original…' } ) );
	expect( screen.getByRole( 'dialog' ) ).toHaveTextContent(
		'All saved and unsaved video edits will be removed.'
	);
	expect( restore ).not.toHaveBeenCalled();
	await user.click( screen.getByRole( 'button', { name: 'Restore original' } ) );
	expect( restore ).toHaveBeenCalledWith( { guid: video.guid } );
	setEdits( {
		can_retry: true,
		job: {
			...processingJob,
			status: 'failed',
			error: { code: 'transcode_failed', message: 'Transcoding failed.' },
		},
	} );
	refresh();
	expect(
		screen.getByText( 'Transcoding failed.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
	expect( retryProcessing ).toHaveBeenCalledWith( { guid: video.guid, jobId: processingJob.id } );
	expect( restore ).toHaveBeenCalledTimes( 1 );
	expect( save ).not.toHaveBeenCalled();
} );

it( 'retries an accepted save that failed while its unchanged draft remains in the editor', async () => {
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	setEdits( { can_retry: true, job: { ...processingJob, status: 'failed' } } );
	refresh();
	await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
	expect( retryProcessing ).toHaveBeenCalledWith( { guid: video.guid, jobId: processingJob.id } );
	expect( save ).toHaveBeenCalledTimes( 1 );
	expect( copy ).not.toHaveBeenCalled();
} );

it( 'keeps a modified draft saveable without retrying older stored instructions', async () => {
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	setEdits( { can_retry: true, job: { ...processingJob, status: 'failed' } } );
	refresh();
	expect(
		screen.getByText( 'Something went wrong applying your edits.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	expect( save ).toHaveBeenCalledWith(
		expect.objectContaining( { operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ] } )
	);
} );

it( 'requires confirmation before replacing a conflicting draft with the latest edits', async () => {
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	setEdits( { revision: 3 } );
	refresh();
	expect(
		screen.getByText( 'This video was edited somewhere else', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Reload latest' } ) );
	await user.keyboard( '{Escape}' );
	expect( refetch ).not.toHaveBeenCalled();
	await user.click( screen.getByRole( 'button', { name: 'Reload latest' } ) );
	await user.click(
		within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Reload latest' } )
	);
	expect( refetch ).toHaveBeenCalledTimes( 1 );
	expect(
		screen.queryByText( 'This video was edited somewhere else', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'allows reloading after the initial edits request fails', async () => {
	jest
		.mocked( useVideoEdits )
		.mockReturnValue( { edits: undefined, isError: true, refetch } as never );
	const { user } = renderEditor( false );
	expect(
		screen.getByText( 'Video edits could not be loaded.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.queryByLabelText( 'Original video preview' ) ).not.toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Try again' } ) );
	expect( refetch ).toHaveBeenCalledTimes( 1 );
} );

it( 'blocks an original with the wrong duration but tolerates metadata rounding', () => {
	renderEditor();
	loadOriginal( 11.001 );
	expect(
		screen.getByText( 'The original video does not match the editing timeline.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	loadOriginal( 10.1 );
	expect(
		screen.queryByText( 'The original video does not match the editing timeline.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'disables edits after a source error but still permits discarding the draft', async () => {
	const { user } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	fireEvent.error( screen.getByLabelText( 'Original video preview' ) );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Discard changes' } ) );
	expect( screen.getByRole( 'dialog', { name: 'Discard changes?' } ) ).toBeInTheDocument();
} );

it( 'creates a separate video and navigates only once its attachment is ready', async () => {
	const { user, refresh } = renderEditor();
	await saveCopy( user );
	expect( copy ).toHaveBeenCalledWith( {
		guid: video.guid,
		baseRevision: 2,
		operations: [ { type: 'cut', start_ms: 0, end_ms: 2000 } ],
		requestId: '8b3d1700-1234-4567-89ab-123456789abc',
		title: `${ video.title } (edited)`,
	} );
	setCopyStatus( copyResponse() );
	refresh();
	expect(
		screen.getByText( 'Your current video stays unchanged.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'Chapters' } ) ).toBeDisabled();
	await user.click( screen.getByRole( 'button', { name: 'Chapters' } ) );
	expect( selectTool ).not.toHaveBeenCalled();
	expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();
	const complete = copyResponse( { ...processingJob, status: 'complete' } );
	setCopyStatus( complete );
	refresh();
	expect( navigate ).not.toHaveBeenCalled();
	setCopyStatus( { ...complete, guid: 'copy123', attachment_id: 99 } );
	refresh();
	expect( successNotice ).toHaveBeenCalledWith(
		'New video created. The original video is unchanged.'
	);
	expect( navigate ).toHaveBeenCalledWith( { href: '/video/99' } );
	expect( screen.getByRole( 'button', { name: 'Discard changes' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	setCopyStatus( { ...complete, guid: 'copy123', attachment_id: 99 } );
	refresh();
	expect( navigate ).toHaveBeenCalledTimes( 1 );
	expect( successNotice ).toHaveBeenCalledTimes( 1 );
	expect( save ).not.toHaveBeenCalled();
	expect( restore ).not.toHaveBeenCalled();
} );

it( 'keeps an unconfirmed copy locked and retries the same captured request', async () => {
	copy.mockRejectedValue( new Error( 'Connection lost' ) );
	const { user } = renderEditor();
	await saveCopy( user );
	expect(
		screen.getByText( 'We could not confirm the new video’s status.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Discard changes' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
	expect( copy ).toHaveBeenCalledTimes( 2 );
	expect( copy.mock.calls[ 1 ][ 0 ] ).toBe( copy.mock.calls[ 0 ][ 0 ] );
	expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument();
	expect( save ).not.toHaveBeenCalled();
} );

it( 'allows polling after an accepted copy status request fails without offering a second submission', async () => {
	const { user, refresh } = renderEditor();
	await saveCopy( user );
	setCopyStatus( undefined, true );
	refresh();
	expect(
		screen.getByText( 'We could not confirm the new video’s status.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();
	expect( copy ).toHaveBeenCalledTimes( 1 );
} );

it( 'keeps a recoverable attachment error locked and offers a safe retry', async () => {
	const { user, refresh } = renderEditor();
	await saveCopy( user );
	setCopyStatus(
		copyResponse( {
			...processingJob,
			status: 'failed',
			error: { code: 'copy_attachment_unconfirmed', message: 'Attachment response lost.' },
		} )
	);
	refresh();
	expect(
		screen.getByText( 'We could not confirm the new video’s status.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
	expect( copy.mock.calls[ 1 ][ 0 ] ).toBe( copy.mock.calls[ 0 ][ 0 ] );
	expect( screen.queryByRole( 'button', { name: 'Dismiss' } ) ).not.toBeInTheDocument();
} );

it( 'distinguishes a created copy from a failed transcode', async () => {
	const { user, refresh } = renderEditor();
	await saveCopy( user );
	setCopyStatus( {
		...copyResponse( {
			...processingJob,
			status: 'failed',
			error: { code: 'transcode_failed', message: 'Transcoding failed.' },
		} ),
		guid: 'copy1234',
		attachment_id: 99,
	} );
	refresh();
	expect(
		screen.getByText( 'The new video was created, but its edits could not be processed.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( navigate ).not.toHaveBeenCalled();
	expect( screen.getByRole( 'button', { name: 'Dismiss' } ) ).toBeInTheDocument();
} );

it.each( [ 'Dismiss', 'Save' ] )(
	'preserves the draft after a failed copy when choosing %s',
	async action => {
		const { user, refresh } = renderEditor();
		await saveCopy( user );
		setCopyStatus(
			copyResponse( {
				...processingJob,
				status: 'failed',
				error: { code: 'transcode_failed', message: 'Transcoding failed.' },
			} )
		);
		refresh();
		expect(
			screen.getByText( 'Your current video and edits are unchanged.', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: action } ) );
		expect(
			screen.queryByText( 'Your current video and edits are unchanged.', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).not.toBeInTheDocument();
		if ( action === 'Save' ) {
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		}
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( save ).not.toHaveBeenCalled();
	}
);

it( 'requires reloading the source after a copy revision conflict', async () => {
	setEdits( {
		can_restore_original: true,
		operations: [ { type: 'trim', start_ms: 0, end_ms: 9000 } ],
	} );
	copy.mockRejectedValue( new EditsConflictError( 'Source changed.', 3 ) );
	const { user } = renderEditor();
	expect( screen.getByRole( 'button', { name: 'More actions' } ) ).toBeInTheDocument();
	await saveCopy( user );
	expect(
		screen.getByText( 'The source video changed.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'Undo' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.queryByRole( 'button', { name: 'More actions' } ) ).not.toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	expect( copy ).toHaveBeenCalledTimes( 1 );
	await user.click( screen.getByRole( 'button', { name: 'Reload latest' } ) );
	expect( refetch ).not.toHaveBeenCalled();
	await user.click(
		within( screen.getByRole( 'dialog' ) ).getByRole( 'button', { name: 'Reload latest' } )
	);
	expect( refetch ).toHaveBeenCalledTimes( 1 );
	expect(
		screen.queryByText( 'The source video changed.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'More actions' } ) ).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'prevents duplicate submission and edits while copy acceptance is pending', async () => {
	copy.mockReturnValue( new Promise( () => {} ) );
	const { user } = renderEditor();
	await saveCopy( user );
	expect(
		screen.getByText( 'Creating your new video', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Check status' } ) ).not.toBeInTheDocument();
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Discard changes' } ) );
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	expect( copy ).toHaveBeenCalledTimes( 1 );
} );

it.each( [ 'Dismiss', 'Save' ] )(
	'preserves the draft after a rejected copy when choosing %s',
	async action => {
		copy.mockRejectedValue(
			new VideoCopyRejectedError( 'quota_exceeded', 'Not enough video storage.' )
		);
		const { user } = renderEditor();
		await saveCopy( user );
		expect(
			screen.getByText( 'Not enough video storage.', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
		await user.click( screen.getByRole( 'button', { name: action } ) );
		expect(
			screen.queryByText( 'Not enough video storage.', {
				exact: false,
				ignore: '.a11y-speak-region, .a11y-speak-region *',
			} )
		).not.toBeInTheDocument();
		if ( action === 'Save' ) {
			await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
		}
		await user.click( screen.getByRole( 'button', { name: 'Undo' } ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( save ).not.toHaveBeenCalled();
	}
);

it( 'shows indeterminate server progress and does not offer edits during processing', () => {
	setEdits( { can_restore_original: true, job: processingJob } );
	renderEditor();
	expect( screen.getByRole( 'progressbar' ) ).not.toHaveAttribute( 'value' );
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.queryByRole( 'button', { name: 'More actions' } ) ).not.toBeInTheDocument();
} );

it( 'does not offer a retry when the failed server job cannot be retried', () => {
	setEdits( { job: { ...processingJob, status: 'failed' } } );
	renderEditor();
	expect(
		screen.getByText( 'Something went wrong applying your edits.', {
			exact: false,
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'Retry' } ) ).not.toBeInTheDocument();
} );

it( 'only prompts when switching away from a dirty editing tool', async () => {
	const { user } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'Chapters' } ) );
	expect( selectTool ).toHaveBeenCalledWith( 'chapters' );
	expect( confirmNavigation ).not.toHaveBeenCalled();
	selectTool.mockClear();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Trim & cut' } ) );
	expect( confirmNavigation ).not.toHaveBeenCalled();
	await user.click( screen.getByRole( 'button', { name: 'Chapters' } ) );
	expect( confirmNavigation ).toHaveBeenCalledTimes( 1 );
	expect( selectTool ).not.toHaveBeenCalled();
	confirmNavigation.mockReturnValue( true );
	await user.click( screen.getByRole( 'button', { name: 'Chapters' } ) );
	expect( selectTool ).toHaveBeenCalledWith( 'chapters' );
} );

it( 'protects dirty drafts on breadcrumb and browser navigation and removes guards on unmount', async () => {
	const { user, unmount } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	expect( fireEvent.click( screen.getByRole( 'link', { name: 'VideoPress' } ) ) ).toBe( false );
	expect( confirmNavigation ).toHaveBeenCalledTimes( 1 );
	const unload = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( unload );
	expect( unload.defaultPrevented ).toBe( true );
	act( () => window.dispatchEvent( new PopStateEvent( 'popstate' ) ) );
	expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );
	navigate.mockClear();
	confirmNavigation.mockReturnValue( true );
	act( () => window.dispatchEvent( new PopStateEvent( 'popstate' ) ) );
	expect( navigate ).not.toHaveBeenCalled();
	unmount();
	confirmNavigation.mockClear();
	const unloaded = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( unloaded );
	window.dispatchEvent( new PopStateEvent( 'popstate' ) );
	expect( unloaded.defaultPrevented ).toBe( false );
	expect( confirmNavigation ).not.toHaveBeenCalled();
} );

it( 'suspends editor shortcuts until the save dialog is dismissed', async () => {
	const { user } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true } );
	await user.keyboard( '{Escape}' );
	expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
	fireEvent.keyDown( document.body, { key: 'z', ctrlKey: true } );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it.each( [ 'update', 'copy' ] )(
	'stops warning on navigation after an accepted %s save',
	async mode => {
		const { user, refresh } = renderEditor();
		if ( mode === 'copy' ) {
			await saveCopy( user );
		} else {
			await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
		}
		const event = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( event );
		expect( event.defaultPrevented ).toBe( false );
		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( confirmNavigation ).not.toHaveBeenCalled();

		if ( mode === 'copy' ) {
			setCopyStatus( copyResponse( { ...processingJob, status: 'failed' } ) );
		} else {
			setEdits( { job: { ...processingJob, status: 'failed' } } );
		}
		refresh();
		const failedEvent = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( failedEvent );
		expect( failedEvent.defaultPrevented ).toBe( true );
	}
);

it( 'keeps a processing copy in the editor and unlocks it when the job completes', () => {
	const processingVideo = { ...video, durationSeconds: 0, isProcessing: true };
	setEdits( { job: processingJob } );
	const { rerender } = render(
		<TrimCutEditor video={ processingVideo } onSelectTool={ selectTool } />,
		{ wrapper: createTestWrapper() }
	);
	expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Video processing placeholder' );
	expect( screen.getByRole( 'button', { name: 'Play' } ) ).toBeDisabled();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getByRole( 'button', { name: 'Chapters' } ) ).toBeDisabled();
	setEdits( { job: { ...processingJob, status: 'complete' }, revision: 3 } );
	rerender( <TrimCutEditor video={ processingVideo } onSelectTool={ selectTool } /> );
	loadOriginal();
	expect( screen.queryByRole( 'status' ) ).not.toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );

it( 'shows the failed job and retained original when attachment metadata never finished', () => {
	setEdits( {
		job: {
			...processingJob,
			status: 'failed',
			error: { code: 'transcode_failed', message: 'The edited video could not be processed.' },
		},
	} );
	render(
		<TrimCutEditor
			video={ { ...video, durationSeconds: 0, isProcessing: true } }
			onSelectTool={ selectTool }
		/>,
		{ wrapper: createTestWrapper() }
	);
	loadOriginal();
	expect(
		screen.getByText( 'The edited video could not be processed.', {
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).not.toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.queryByText( 'Video processing placeholder' ) ).not.toBeInTheDocument();
} );

it( 'restores the pending copy draft after returning to the source editor', async () => {
	const { user, unmount } = renderEditor();
	await saveCopy( user );
	unmount();
	renderEditor();
	expect( screen.getByRole( 'button', { name: 'New cut' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getAllByRole( 'slider', { name: /Cut/ } ) ).toHaveLength( 2 );
	const event = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( event );
	expect( event.defaultPrevented ).toBe( false );
	expect( copy ).toHaveBeenCalledTimes( 1 );
} );

it( 'continues to warn if a copy submission has not been confirmed', async () => {
	copy.mockRejectedValueOnce( new Error( 'Connection interrupted' ) );
	const { user } = renderEditor();
	await saveCopy( user );
	const event = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( event );
	expect( event.defaultPrevented ).toBe( true );
} );

it( 'detects source edits made while a pending copy was away from the editor', async () => {
	const { user, unmount } = renderEditor();
	await saveCopy( user );
	unmount();
	setEdits( { revision: 3, operations: [ { type: 'trim', start_ms: 1000, end_ms: 9000 } ] } );
	setCopyStatus( copyResponse( { ...processingJob, status: 'failed' } ) );
	renderEditor();
	expect(
		screen.getByText( 'This video was edited somewhere else since you opened the editor.', {
			ignore: '.a11y-speak-region, .a11y-speak-region *',
		} )
	).toBeInTheDocument();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	expect( screen.getAllByRole( 'slider', { name: /Cut/ } ) ).toHaveLength( 2 );
} );

it( 'retries a failed copy after returning with missing playback metadata', async () => {
	setEdits( { can_retry: true, job: { ...processingJob, status: 'failed' } } );
	const user = userEvent.setup();
	render(
		<TrimCutEditor
			video={ { ...video, isProcessing: true, durationSeconds: 0 } }
			onSelectTool={ jest.fn() }
		/>,
		{ wrapper: createTestWrapper() }
	);
	await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
	expect( retryProcessing ).toHaveBeenCalledWith( { guid: video.guid, jobId: processingJob.id } );
	expect( save ).not.toHaveBeenCalled();
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
} );
