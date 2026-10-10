/* eslint-disable testing-library/prefer-user-event -- Media, browser navigation, and document shortcuts need native events. */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch } from '@wordpress/data';
import { useNavigate } from '@wordpress/route';
import { useRestoreOriginal } from '../../../hooks/use-restore-original';
import { useRetryVideoProcessing } from '../../../hooks/use-retry-video-processing';
import { useSaveVideoEdits } from '../../../hooks/use-save-video-edits';
import { useVideoEdits } from '../../../hooks/use-video-edits';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { createTestWrapper } from '../../../test-utils/query-client-wrapper';
import TrimCutEditor from '../editor-screen';
import type { EditsJob, VideoEdits } from '../../../types/edits';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn( () => ( { name: 'mock-store' } ) ),
	createSelector: jest.fn( selector => selector ),
	keyedReducer: jest.fn( ( _key, reducer ) => reducer ),
	register: jest.fn(),
	select: jest.fn( () => ( {} ) ),
	dispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => ( {} ) ),
	useRegistry: jest.fn( () => ( { select: jest.fn(), dispatch: jest.fn() } ) ),
	useDispatch: jest.fn(),
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
const refetch = jest.fn();
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

beforeEach( () => {
	jest.clearAllMocks();
	confirmNavigation = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
	jest.mocked( useNavigate ).mockReturnValue( navigate );
	jest.mocked( useDispatch ).mockReturnValue( {
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
	jest.mocked( useSaveVideoEdits ).mockReturnValue( { mutateAsync: save } as never );
	jest
		.mocked( useRetryVideoProcessing )
		.mockReturnValue( { mutateAsync: retryProcessing } as never );
	retryProcessing.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
	jest.mocked( useRestoreOriginal ).mockReturnValue( { mutateAsync: restore } as never );
	save.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
	restore.mockResolvedValue( { guid: video.guid, revision: 2, job: processingJob } );
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
	expect( screen.getByRole( 'dialog', { name: 'Update video?' } ) ).toHaveTextContent(
		'Existing chapters may need to be adjusted'
	);
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	expect( save ).toHaveBeenCalledWith( {
		guid: video.guid,
		baseRevision: 2,
		operations: [ { type: 'cut', start_ms: 0, end_ms: 4000 } ],
	} );
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
		operations: [ { type: 'cut', start_ms: 0, end_ms: 4000 } ],
		job: { ...processingJob, status: 'complete' },
	} );
	refresh();
	expect( successNotice ).toHaveBeenCalledWith( 'Video edits applied.', { type: 'snackbar' } );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
		'aria-disabled',
		'true'
	);
	fireEvent.keyDown( screen.getByRole( 'slider', { name: 'Trim start' } ), { key: 'ArrowRight' } );
	expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
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
		expect.objectContaining( { operations: [ { type: 'cut', start_ms: 0, end_ms: 4000 } ] } )
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

it( 'stops warning on navigation after an accepted save', async () => {
	const { user, refresh } = renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	const event = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( event );
	expect( event.defaultPrevented ).toBe( false );
	await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
	expect( confirmNavigation ).not.toHaveBeenCalled();

	setEdits( { job: { ...processingJob, status: 'failed' } } );
	refresh();
	const failedEvent = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( failedEvent );
	expect( failedEvent.defaultPrevented ).toBe( true );
} );

it( 'keeps a processing video in the editor and unlocks it when the job completes', () => {
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

it( 'retries a failed edit after returning with missing playback metadata', async () => {
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
