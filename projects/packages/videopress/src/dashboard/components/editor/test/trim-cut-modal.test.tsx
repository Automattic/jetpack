/* eslint-disable testing-library/prefer-user-event -- Media events and scoped keyboard shortcuts need native events. */
import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDispatch } from '@wordpress/data';
import TrimCutModal from '../../../../client/components/trim-cut-modal/lazy';
import { useRestoreOriginal } from '../../../hooks/use-restore-original';
import { useRetryVideoProcessing } from '../../../hooks/use-retry-video-processing';
import { useSaveVideoEdits } from '../../../hooks/use-save-video-edits';
import { useVideo } from '../../../hooks/use-video';
import { useVideoEdits } from '../../../hooks/use-video-edits';
import { makeLibraryItem } from '../../../test-utils/library-item';
import type { EditsJob, VideoEdits } from '../../../types/edits';

jest.mock( '../../../hooks/use-video', () => ( { useVideo: jest.fn() } ) );
jest.mock( '@wordpress/theme', () => ( { ThemeProvider: ( { children } ) => children } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	combineReducers: jest.fn( reducers => reducers ),
	createReduxStore: jest.fn( () => ( { name: 'mock-store' } ) ),
	createSelector: jest.fn( selector => selector ),
	keyedReducer: jest.fn( ( _key, reducer ) => reducer ),
	register: jest.fn(),
	select: jest.fn( () => ( {} ) ),
	dispatch: jest.fn( () => ( {} ) ),
	useSelect: jest.fn( () => [] ),
	useRegistry: jest.fn( () => ( { select: jest.fn(), dispatch: jest.fn() } ) ),
	useDispatch: jest.fn(),
} ) );
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
const onClose = jest.fn();
const onProcessed = jest.fn();
const successNotice = jest.fn();
const errorNotice = jest.fn();

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
async function renderEditor( ready = true ) {
	const modal = (
		<TrimCutModal
			guid={ video.guid }
			attachmentId={ Number( video.id ) }
			onClose={ onClose }
			onProcessed={ onProcessed }
		/>
	);
	const view = render( modal );
	await expect( screen.findByRole( 'dialog', {}, { timeout: 5000 } ) ).resolves.toBeInTheDocument();
	if ( ready ) {
		loadOriginal();
	}
	return {
		...view,
		user: userEvent.setup(),
		refresh: () =>
			view.rerender(
				<TrimCutModal
					guid={ video.guid }
					attachmentId={ Number( video.id ) }
					onClose={ onClose }
					onProcessed={ onProcessed }
				/>
			),
	};
}

beforeEach( () => {
	jest.clearAllMocks();
	jest.mocked( useVideo ).mockReturnValue( { video, isError: false, refetch } as never );
	jest.mocked( useDispatch ).mockReturnValue( {
		removeNotice: jest.fn(),
		removeAllNotices: jest.fn(),
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
it( 'confirms unsaved edits on close and Escape without dismissing the modal on cancel', async () => {
	const { user } = await renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
	expect( onClose ).not.toHaveBeenCalled();
	await user.click(
		within( screen.getByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Cancel' } )
	);
	expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	await user.keyboard( '{Escape}' );
	await user.click(
		within( screen.getByRole( 'alertdialog' ) ).getByRole( 'button', { name: 'Discard' } )
	);
	expect( onClose ).toHaveBeenCalledTimes( 1 );
	expect( save ).not.toHaveBeenCalled();
} );

it( 'blocks close during submission but allows leaving after processing is accepted', async () => {
	let accept: ( value: unknown ) => void;
	save.mockImplementation(
		() =>
			new Promise( resolve => {
				accept = resolve;
			} )
	);
	const { user } = await renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
	expect( onClose ).not.toHaveBeenCalled();
	await act( async () => accept( { guid: video.guid, revision: 2, job: processingJob } ) );
	await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
	expect( onClose ).toHaveBeenCalledTimes( 1 );
	expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	expect( save ).toHaveBeenCalledWith(
		expect.objectContaining( { guid: video.guid, baseRevision: 2 } )
	);
} );

it( 'preserves unsaved edits when submission fails', async () => {
	save.mockRejectedValue( new Error( 'Network error' ) );
	const { user } = await renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Save' } ) );
	await user.click( screen.getByRole( 'button', { name: 'Update video' } ) );
	await waitFor( () => expect( errorNotice ).toHaveBeenCalled() );
	await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
	expect( screen.getByRole( 'alertdialog' ) ).toBeInTheDocument();
	expect( onClose ).not.toHaveBeenCalled();
} );

it( 'refreshes the block preview once a job completes', async () => {
	setEdits( { job: processingJob } );
	const { refresh } = await renderEditor();
	expect( onProcessed ).not.toHaveBeenCalled();
	setEdits( { job: { ...processingJob, status: 'complete' }, revision: 3 } );
	refresh();
	expect( onProcessed ).toHaveBeenCalledTimes( 1 );
	refresh();
	expect( onProcessed ).toHaveBeenCalledTimes( 1 );
} );

it( 'keeps undo shortcuts inside the modal', async () => {
	const { user } = await renderEditor();
	await user.click( screen.getByRole( 'button', { name: 'New cut' } ) );
	const documentKey = jest.fn();
	document.addEventListener( 'keydown', documentKey );
	try {
		fireEvent.keyDown( screen.getByLabelText( 'Original video preview' ), {
			key: 'z',
			ctrlKey: true,
		} );
		expect( documentKey ).not.toHaveBeenCalled();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} finally {
		document.removeEventListener( 'keydown', documentKey );
	}
} );

it( 'rejects attachment metadata belonging to another video', async () => {
	jest
		.mocked( useVideo )
		.mockReturnValue( { video: { ...video, guid: 'other' }, isError: false, refetch } as never );
	await renderEditor( false );
	expect(
		within( screen.getByRole( 'dialog' ) ).getByText(
			'Video information could not be loaded. Please try again.'
		)
	).toBeInTheDocument();
	expect( screen.queryByRole( 'button', { name: 'New cut' } ) ).not.toBeInTheDocument();
} );
