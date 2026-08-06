/* eslint-disable testing-library/prefer-user-event -- The modal-body shortcuts need keydowns with modifier combinations aimed at specific non-focusable elements, which userEvent.keyboard (focused-element only) can't address. */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChapterManagerModal from '..';
import { fetchVideoItem } from '../../../lib/fetch-video-item';
import { parseDescription, serializeDescription } from '../../../utils/video-chapters/description';
import { probeManualTrack } from '../../../utils/video-chapters/probe-manual-track';
import { syncChapters } from '../../../utils/video-chapters/sync-chapters';

const mockUpdateMediaItem = jest.fn();
let mockPlayerProps: Record< string, unknown > = {};
const mockPlayerHandle = {
	seekTo: jest.fn(),
	play: jest.fn(),
	pause: jest.fn(),
	togglePlay: jest.fn(),
	isPlaying: jest.fn( () => false ),
};

jest.mock( '@wordpress/components', () => ( {
	Button: jest
		.requireActual( '@wordpress/element' )
		.forwardRef( ( { children, onClick, disabled, label }, ref ) => (
			<button ref={ ref } aria-label={ label } onClick={ onClick } disabled={ disabled }>
				{ children ?? label }
			</button>
		) ),
	Modal: ( { children, title, headerActions } ) => (
		<div role="dialog" aria-label={ title }>
			{ headerActions }
			{ children }
		</div>
	),
	SnackbarList: ( { notices, onRemove } ) => (
		<div data-testid="snackbar-list">
			{ notices.map( ( notice: { id: string; content: string } ) => (
				<div key={ notice.id } data-testid="snackbar">
					{ notice.content }
					<button aria-label="Dismiss notice" onClick={ () => onRemove( notice.id ) }>
						Dismiss
					</button>
				</div>
			) ) }
		</div>
	),
} ) );

jest.mock( '../../../lib/fetch-video-item', () => ( {
	fetchVideoItem: jest.fn(),
} ) );

jest.mock( '../../../utils/video-chapters/probe-manual-track', () => ( {
	probeManualTrack: jest.fn(),
} ) );

jest.mock( '../../../utils/video-chapters/sync-chapters', () => ( {
	syncChapters: jest.fn(),
} ) );

jest.mock( '../../../block-editor/hooks/use-video-data-update', () => ( {
	__esModule: true,
	default: () => mockUpdateMediaItem,
} ) );

/*
 * The shared chapters preview player is exercised by its own test file; here
 * a stub records the props it receives and exposes the imperative handle the
 * modal drives.
 */
jest.mock( '../../chapters-editor/preview/preview-player', () => {
	const { forwardRef, useImperativeHandle } = jest.requireActual( '@wordpress/element' );
	return {
		__esModule: true,
		default: forwardRef( ( props: Record< string, unknown >, ref ) => {
			mockPlayerProps = props;
			useImperativeHandle( ref, () => mockPlayerHandle );
			return <div data-testid="preview-player" />;
		} ),
	};
} );

/*
 * The timeline is exercised by its own test file; here a stub surfaces the
 * gating props (locked/readOnly/shortcutsEnabled/duration) and offers plain
 * buttons that dispatch into the real store, so lock and dirt semantics are
 * tested against the real reducer.
 */
jest.mock( '../../chapters-editor/chapters/chapters-timeline', () => ( {
	__esModule: true,
	default: ( { session, dispatch, locked, readOnly, shortcutsEnabled } ) => (
		<div
			data-testid="chapters-timeline"
			data-locked={ String( Boolean( locked ) ) }
			data-readonly={ String( Boolean( readOnly ) ) }
			data-shortcuts={ String( Boolean( shortcutsEnabled ) ) }
			data-duration={ String( session.durationMs ) }
		>
			<button onClick={ () => dispatch( { type: 'ADD_AT', atMs: 90000 } ) }>
				Add test chapter
			</button>
			<button
				onClick={ () =>
					dispatch( { type: 'SELECT', id: session.chapters[ session.chapters.length - 1 ].id } )
				}
			>
				Select last chapter
			</button>
			{ /* Stand-ins for the real rows' remove buttons: focusable controls
			     that unmount themselves when clicked, which is what strands
			     focus on <body>. */ }
			{ session.chapters.map( ( chapter: { id: string }, index: number ) => (
				<button key={ chapter.id } onClick={ () => dispatch( { type: 'REMOVE', id: chapter.id } ) }>
					{ `Remove chapter ${ index + 1 }` }
				</button>
			) ) }
			<input aria-label="Chapter title input" />
		</div>
	),
} ) );

const videoItem = {
	duration: 120000,
	width: 1920,
	height: 1080,
	file_url_base: { https: 'https://videos.files.wordpress.com/abc123/' },
	files: { hd: { mp4: 'clip_hd.mp4' } },
};

const BASE_DESCRIPTION = 'Intro prose.\n\n0:00 Start\n0:30 Middle\n1:00 End';

const defaultProps = {
	isOpen: true,
	guid: 'abc123',
	attachmentId: 42,
	description: BASE_DESCRIPTION,
	title: 'Test video',
	isPrivate: false,
	onClose: jest.fn(),
	onSaved: jest.fn(),
};

/**
 * The description Save is expected to POST: the baseline rows plus the stub
 * timeline's "Add test chapter" (90s, default title "Chapter 4"), serialized
 * by the real description module.
 */
const savedDescription = serializeDescription( BASE_DESCRIPTION, [
	...parseDescription( BASE_DESCRIPTION ).rows,
	{ startAtSeconds: 90, title: 'Chapter 4' },
] );

describe( 'ChapterManagerModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockPlayerProps = {};
		mockPlayerHandle.isPlaying.mockReturnValue( false );
		( fetchVideoItem as jest.Mock ).mockResolvedValue( videoItem );
		( probeManualTrack as jest.Mock ).mockResolvedValue( 'editable' );
		( syncChapters as jest.Mock ).mockResolvedValue( 'uploaded' );
		mockUpdateMediaItem.mockResolvedValue( { code: 'success', data: 200 } );
	} );

	const openReady = async ( props: Partial< typeof defaultProps > = {} ) => {
		render( <ChapterManagerModal { ...defaultProps } { ...props } /> );
		const timeline = await screen.findByTestId( 'chapters-timeline' );
		await waitFor( () => expect( timeline ).toHaveAttribute( 'data-locked', 'false' ) );
		return timeline;
	};

	it( 'fetches the item once on open, feeding the timeline, the preview, and the probe', async () => {
		const timeline = await openReady();

		expect(
			screen.getByRole( 'dialog', { name: 'Manage chapters for Test video' } )
		).toBeInTheDocument();
		expect( fetchVideoItem ).toHaveBeenCalledTimes( 1 );
		expect( fetchVideoItem ).toHaveBeenCalledWith( { guid: 'abc123', isPrivate: false } );
		// The probe reuses the fetched item instead of fetching it again.
		expect( probeManualTrack ).toHaveBeenCalledWith(
			{ guid: 'abc123', isPrivate: false },
			{ item: videoItem }
		);
		expect( timeline ).toHaveAttribute( 'data-duration', '120000' );
		expect( timeline ).toHaveAttribute( 'data-readonly', 'false' );
		// Document-level shortcuts stay off; the modal body maps the keys itself.
		expect( timeline ).toHaveAttribute( 'data-shortcuts', 'false' );
		// The shared player receives the item-derived video: the best H.264
		// rendition, the duration in seconds, and no original-upload fallback.
		expect( mockPlayerProps.video ).toEqual( {
			guid: 'abc123',
			isPrivate: false,
			durationSeconds: 120,
			playbackUrl: 'https://videos.files.wordpress.com/abc123/clip_hd.mp4',
			sourceUrl: undefined,
		} );
	} );

	it( 'stays locked until the probe settles, dropping edits made meanwhile', async () => {
		const user = userEvent.setup();
		let resolveProbe: ( result: 'manual' | 'editable' ) => void;
		( probeManualTrack as jest.Mock ).mockImplementation(
			() =>
				new Promise( resolve => {
					resolveProbe = resolve;
				} )
		);

		render( <ChapterManagerModal { ...defaultProps } /> );
		const timeline = await screen.findByTestId( 'chapters-timeline' );
		expect( timeline ).toHaveAttribute( 'data-locked', 'true' );

		// The locked store drops the dispatch, so no dirt can arise in the probe window.
		await user.click( screen.getByText( 'Add test chapter' ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();

		await act( async () => {
			resolveProbe( 'editable' );
		} );
		expect( timeline ).toHaveAttribute( 'data-locked', 'false' );

		await user.click( screen.getByText( 'Add test chapter' ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
	} );

	it( 'turns read-only on a manual chapters VTT and keeps the session inert', async () => {
		const user = userEvent.setup();
		( probeManualTrack as jest.Mock ).mockResolvedValue( 'manual' );

		const timeline = await openReady();
		expect( timeline ).toHaveAttribute( 'data-readonly', 'true' );

		// Defense-in-depth: even a dispatch that slips past the (hidden) edit
		// affordances must not arm Save against a manually-managed description.
		await user.click( screen.getByText( 'Add test chapter' ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Discard changes' } ) ).toBeDisabled();
	} );

	it( 'shows an unavailable notice instead of the editor when the item fetch fails', async () => {
		( fetchVideoItem as jest.Mock ).mockRejectedValue( new Error( 'network down' ) );

		render( <ChapterManagerModal { ...defaultProps } /> );

		await expect( screen.findByText( /couldn’t be loaded/ ) ).resolves.toBeInTheDocument();
		expect( screen.queryByTestId( 'chapters-timeline' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
	} );

	it( 'saves the description meta FIRST and only then fires the VTT sync and onSaved', async () => {
		const user = userEvent.setup();
		const timeline = await openReady();

		await user.click( screen.getByText( 'Add test chapter' ) );
		expect( timeline ).toHaveAttribute( 'data-duration', '120000' );

		let resolveMeta: ( value: unknown ) => void;
		mockUpdateMediaItem.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveMeta = resolve;
				} )
		);

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		expect( mockUpdateMediaItem ).toHaveBeenCalledWith( { description: savedDescription } );
		// Meta first: nothing else runs while the POST is in flight.
		expect( syncChapters ).not.toHaveBeenCalled();
		expect( defaultProps.onSaved ).not.toHaveBeenCalled();

		await act( async () => {
			resolveMeta( { code: 'success', data: 200 } );
		} );

		expect( syncChapters ).toHaveBeenCalledWith(
			// attributes-style duration is ms; the sync contract wants seconds.
			{ guid: 'abc123', isPrivate: false, durationSeconds: 120 },
			savedDescription,
			{ onWarning: expect.any( Function ) }
		);
		expect( defaultProps.onSaved ).toHaveBeenCalledWith( savedDescription );
		// A valid set gets the plain success wording, not the warning one.
		expect( screen.getByTestId( 'snackbar-list' ) ).toHaveTextContent( 'Chapters saved.' );
		expect( screen.getByTestId( 'snackbar-list' ) ).not.toHaveTextContent(
			'won’t appear in the player'
		);
		// The store re-baselined on the saved description.
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
	} );

	it( 'warns instead of announcing success when the saved chapters are invalid', async () => {
		const user = userEvent.setup();
		await openReady();

		// Two chapters is below the three the player's VTT requires, so the
		// sync will delete the auto-generated track instead of rewriting it.
		await user.click( screen.getByRole( 'button', { name: 'Remove chapter 3' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		// The description is still written — it is the source of truth and
		// holds the user's prose — and the sync still runs.
		const twoChapterDescription = serializeDescription( BASE_DESCRIPTION, [
			{ startAtSeconds: 0, title: 'Start' },
			{ startAtSeconds: 30, title: 'Middle' },
		] );
		await waitFor( () =>
			expect( mockUpdateMediaItem ).toHaveBeenCalledWith( { description: twoChapterDescription } )
		);
		expect( syncChapters ).toHaveBeenCalledWith(
			{ guid: 'abc123', isPrivate: false, durationSeconds: 120 },
			twoChapterDescription,
			{ onWarning: expect.any( Function ) }
		);
		expect( defaultProps.onSaved ).toHaveBeenCalledWith( twoChapterDescription );

		// …but the outcome message must not read as an unqualified success.
		const snackbars = screen.getByTestId( 'snackbar-list' );
		expect( snackbars ).toHaveTextContent(
			'Chapters saved to the description, but they won’t appear in the player until they meet the requirements.'
		);
		expect( snackbars ).not.toHaveTextContent( 'Chapters saved.' );
	} );

	it( 'reclaims focus for the editor when an edit unmounts the focused control', async () => {
		const user = userEvent.setup();
		await openReady();

		const removeThird = screen.getByRole( 'button', { name: 'Remove chapter 3' } );
		removeThird.focus();
		expect( removeThird ).toHaveFocus();

		await user.click( removeThird );

		// The row it lived in is gone. Focus must not be left on <body>: that
		// is outside the Modal's portal, where the body's Escape intercept
		// never fires — taking away the modal's only dismiss affordance.
		expect( screen.queryByRole( 'button', { name: 'Remove chapter 3' } ) ).not.toBeInTheDocument();
		expect( document.body ).not.toHaveFocus();

		// Proof that focus landed somewhere the modal's key handling covers:
		// Escape still reaches it, and (the session being dirty) raises the
		// discard confirmation.
		// eslint-disable-next-line @wordpress/no-global-active-element, testing-library/no-node-access -- the assertion IS about where document-level focus ended up.
		fireEvent.keyDown( document.activeElement as Element, { key: 'Escape' } );
		expect( screen.getByRole( 'alertdialog' ) ).toHaveTextContent(
			'Discard unsaved chapter changes?'
		);
	} );

	it( 'keeps the session dirty and withholds onSaved when the meta POST fails', async () => {
		const user = userEvent.setup();
		await openReady();

		await user.click( screen.getByText( 'Add test chapter' ) );
		mockUpdateMediaItem.mockRejectedValue( new Error( 'meta failed' ) );

		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () =>
			expect( screen.getByTestId( 'snackbar-list' ) ).toHaveTextContent(
				'Failed to save chapters.'
			)
		);
		expect( syncChapters ).not.toHaveBeenCalled();
		expect( defaultProps.onSaved ).not.toHaveBeenCalled();
		// Still dirty: Save stays armed for another attempt.
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
	} );

	it( 'refuses to close while a save is in flight', async () => {
		const user = userEvent.setup();
		await openReady();

		await user.click( screen.getByText( 'Add test chapter' ) );

		let resolveMeta: ( value: unknown ) => void;
		mockUpdateMediaItem.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveMeta = resolve;
				} )
		);
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		// Both close affordances are inert while the meta POST is pending.
		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
		fireEvent.keyDown( screen.getByTestId( 'chapters-timeline' ), { key: 'Escape' } );
		expect( defaultProps.onClose ).not.toHaveBeenCalled();

		await act( async () => {
			resolveMeta( { code: 'success', data: 200 } );
		} );
		expect( defaultProps.onSaved ).toHaveBeenCalled();

		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );
		expect( defaultProps.onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'guards a dirty close behind the discard confirmation', async () => {
		const user = userEvent.setup();
		await openReady();

		await user.click( screen.getByText( 'Add test chapter' ) );
		await user.click( screen.getByRole( 'button', { name: 'Close' } ) );

		expect( defaultProps.onClose ).not.toHaveBeenCalled();
		const confirmation = screen.getByRole( 'alertdialog' );
		expect( confirmation ).toHaveTextContent( 'Discard unsaved chapter changes?' );

		await user.click( screen.getByRole( 'button', { name: 'Discard' } ) );
		expect( defaultProps.onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'maps Space, mod+Z, and Delete on the modal body, bailing on editable targets', async () => {
		const user = userEvent.setup();
		const timeline = await openReady();

		// Space toggles playback…
		fireEvent.keyDown( timeline, { key: ' ' } );
		expect( mockPlayerHandle.togglePlay ).toHaveBeenCalledTimes( 1 );
		// …but never from inside a text field.
		fireEvent.keyDown( screen.getByLabelText( 'Chapter title input' ), { key: ' ' } );
		expect( mockPlayerHandle.togglePlay ).toHaveBeenCalledTimes( 1 );

		// mod+Z / shift+mod+Z drive the store's history.
		await user.click( screen.getByText( 'Add test chapter' ) );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
		fireEvent.keyDown( timeline, { key: 'z', ctrlKey: true } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();
		fireEvent.keyDown( timeline, { key: 'z', ctrlKey: true, shiftKey: true } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
		fireEvent.keyDown( timeline, { key: 'z', ctrlKey: true } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeDisabled();

		// Delete removes the selected chapter.
		await user.click( screen.getByText( 'Select last chapter' ) );
		fireEvent.keyDown( timeline, { key: 'Delete' } );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toBeEnabled();
	} );
} );
