import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeLibraryItem } from '../../../test-utils/library-item';
import Editor from '../editor';
import type { LibraryItem } from '../../../types/library';
import type { EditorUploadSession } from '../editor';

// ChaptersSummary builds its editor deep link through useLinkProps.
jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
	useLinkProps: ( { to }: { to: string } ) => ( { href: to } ),
	Link: ( { to, children }: { to: string; children: React.ReactNode } ) => (
		<a href={ to }>{ children }</a>
	),
} ) );

// Only the page-chrome variant renders these; the draft session under test is
// embedded. Stubbed anyway so the non-draft control case can mount.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( {
		breadcrumbs,
		actions,
		children,
	}: {
		breadcrumbs?: React.ReactNode;
		actions?: React.ReactNode;
		children?: React.ReactNode;
	} ) => (
		<div>
			<div>{ breadcrumbs }</div>
			<div>{ actions }</div>
			{ children }
		</div>
	),
} ) );
// Renders the parent crumb as the router link it really is — the dirty-form
// guard below is caught on the way down to it.
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: { label: string; to?: string }[] } ) => (
		<nav>
			{ items.map( item =>
				item.to ? (
					<a key={ item.label } href={ item.to }>
						{ item.label }
					</a>
				) : (
					<span key={ item.label }>{ item.label }</span>
				)
			) }
		</nav>
	),
} ) );

// The info card's copy buttons post a snackbar through the notices store.
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: jest.fn(),
		createErrorNotice: jest.fn(),
		createInfoNotice: jest.fn(),
	} ),
} ) );

// The GUID-dependent cards and the player carry their own queries; here only
// WHETHER they render matters — the draft session must hold skeleton shells
// in their place until the record is real.
jest.mock( '../preview-player', () => ( {
	__esModule: true,
	default: () => <div data-testid="preview-player" />,
} ) );
jest.mock( '../thumbnail-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="thumbnail-card" />,
} ) );
jest.mock( '../subtitles-card', () => ( {
	__esModule: true,
	default: () => <div data-testid="subtitles-card" />,
} ) );
// The info card resolves its share link through this module, so the mock keeps
// the real implementation alongside the stubbed card.
jest.mock( '../video-info-card', () => ( {
	__esModule: true,
	...jest.requireActual( '../video-info-card' ),
	default: () => <div data-testid="video-info-card" />,
} ) );
jest.mock( '../chapters-help-modal', () => ( {
	__esModule: true,
	default: ( { isOpen }: { isOpen: boolean } ) =>
		isOpen ? <div data-testid="chapters-help-modal" /> : null,
} ) );

const noop = () => undefined;

const draftVideo = makeLibraryItem( {
	id: 'draft-clip',
	guid: '',
	type: 'local',
	title: 'clip',
	filename: 'clip.mp4',
} );

/**
 * Full prop set for Editor with inert handlers, so each case only spells out
 * the video + session under test.
 *
 * @param video         - The record the surface renders.
 * @param uploadSession - The draft-session state, when the case is a draft.
 * @return Editor props.
 */
function editorProps( video: LibraryItem, uploadSession?: EditorUploadSession ) {
	return {
		video,
		onSave: jest.fn(),
		isSaving: false,
		onDelete: noop,
		onDownload: noop,
		onManageCaptions: noop,
		chaptersOpen: false,
		setChaptersOpen: noop,
		uploadSession,
	};
}

describe( 'Editor pending media', () => {
	// The cards that need a poster or a GUID refuse to render until the
	// transcode lands, so without a stand-in the settings column arrives two
	// cards short and jumps as they appear. This holds for a video that is
	// merely processing — no upload session in sight — which is what a user
	// sees right after the upload flow hands them to /video/:id.
	it( 'holds skeletons for a processing video with no upload session', () => {
		render(
			<Editor
				{ ...editorProps(
					makeLibraryItem( {
						id: '77',
						guid: 'g77',
						type: 'videopress',
						isProcessing: true,
					} )
				) }
			/>
		);

		expect( screen.queryByTestId( 'thumbnail-card' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'subtitles-card' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Thumbnail' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subtitles' ) ).toBeInTheDocument();
	} );

	it( 'renders the real cards once the video is playable', () => {
		render(
			<Editor
				{ ...editorProps(
					makeLibraryItem( {
						id: '77',
						guid: 'g77',
						type: 'videopress',
						isProcessing: false,
					} )
				) }
			/>
		);

		expect( screen.getByTestId( 'thumbnail-card' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'subtitles-card' ) ).toBeInTheDocument();
	} );

	// A failed conversion never clears `isProcessing` — the failure is reported
	// inside the player iframe and nowhere in the media payload — so these
	// placeholders used to animate for the life of the tab. Live testing
	// watched them still going at three and a half minutes.
	it( 'stops the placeholders claiming to load once the wait is hopeless', () => {
		jest.useFakeTimers();
		try {
			render(
				<Editor
					{ ...editorProps(
						makeLibraryItem( {
							id: '77',
							guid: 'g77',
							type: 'videopress',
							isProcessing: true,
						} )
					) }
				/>
			);

			expect( screen.queryByText( /may have failed to convert/ ) ).not.toBeInTheDocument();

			act( () => {
				jest.advanceTimersByTime( 2 * 60 * 1000 );
			} );

			expect( screen.getAllByText( /may have failed to convert/ ) ).toHaveLength( 2 );
			expect( screen.getAllByRole( 'status' ) ).toHaveLength( 2 );
			expect( screen.getByText( /no thumbnail to choose from/ ) ).toBeInTheDocument();
			expect( screen.getByText( /subtitles can’t be loaded/ ) ).toBeInTheDocument();
			// Still the same two cards, in the same slots — the shape the
			// placeholders exist to hold doesn't change, only the claim.
			expect( screen.getByText( 'Thumbnail' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Subtitles' ) ).toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'never runs the clock down while the bytes are still going up', () => {
		jest.useFakeTimers();
		try {
			render(
				<Editor
					{ ...editorProps(
						makeLibraryItem( { id: '77', guid: '', type: 'local', isProcessing: false } ),
						{
							uploadState: { status: 'uploading', progress: 12, fileName: 'huge.mp4' },
							saveDisabled: true,
						}
					) }
				/>
			);

			act( () => {
				jest.advanceTimersByTime( 10 * 60 * 1000 );
			} );

			// A 10-minute upload is a slow connection, not a dead video; that
			// wait has its own progress bar to explain itself.
			expect( screen.queryByText( /may have failed to convert/ ) ).not.toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );

	it( 'hands the slot back to the real cards if the record does resolve', () => {
		jest.useFakeTimers();
		try {
			const processing = makeLibraryItem( {
				id: '77',
				guid: 'g77',
				type: 'videopress',
				isProcessing: true,
			} );
			const { rerender } = render( <Editor { ...editorProps( processing ) } /> );

			act( () => {
				jest.advanceTimersByTime( 2 * 60 * 1000 );
			} );
			expect( screen.getAllByText( /may have failed to convert/ ) ).toHaveLength( 2 );

			rerender( <Editor { ...editorProps( { ...processing, isProcessing: false } ) } /> );

			expect( screen.queryByText( /may have failed to convert/ ) ).not.toBeInTheDocument();
			expect( screen.getByTestId( 'thumbnail-card' ) ).toBeInTheDocument();
		} finally {
			jest.useRealTimers();
		}
	} );
} );

describe( 'Editor upload session', () => {
	it( 'stages the upload in the player slot and holds Save off', async () => {
		const user = userEvent.setup();
		render(
			<Editor
				embedded
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'uploading', progress: 42, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		expect( screen.getByText( 'clip.mp4' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Uploading… 42%' ) ).toBeInTheDocument();
		// The stage covers the player; it does not replace it (see the
		// identity test below for why that distinction matters).
		expect( screen.getByTestId( 'upload-stage' ) ).toBeInTheDocument();

		// The form is editable from the first frame, but Save waits for the
		// attachment id — dirtying the form must not light it up. (@wordpress/ui
		// Button disables via aria-disabled, not the disabled attribute.)
		await user.type( screen.getByLabelText( 'Title' ), '!' );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		// GUID-dependent cards hold skeleton shells in place rather than
		// popping in later; the ⋯ menu of would-be no-ops is hidden.
		expect( screen.queryByTestId( 'thumbnail-card' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'subtitles-card' ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'video-info-card' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Thumbnail' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Subtitles' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Video info' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'More actions' } ) ).not.toBeInTheDocument();
	} );

	// The bug this guards: the player used to be SWAPPED for the upload stage,
	// so the instant processing finished the iframe was torn down and rebuilt —
	// a video the user had already started watching stopped dead and needed a
	// second press of play. Overlaying keeps the same element across the
	// transition. Node identity is the assertion; anything weaker passes on the
	// old code.
	it( 'keeps the very same player element across the processing transition', () => {
		const video = makeLibraryItem( { id: '77', guid: 'g77', type: 'videopress' } );
		const { rerender } = render(
			<Editor
				{ ...editorProps( video, {
					uploadState: { status: 'processing', progress: 100, fileName: 'clip.mp4' },
					saveDisabled: false,
				} ) }
			/>
		);

		const playerDuringProcessing = screen.getByTestId( 'preview-player' );

		rerender( <Editor { ...editorProps( video, { saveDisabled: false } ) } /> );

		expect( screen.queryByTestId( 'upload-stage' ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'preview-player' ) ).toBe( playerDuringProcessing );
	} );

	it( 'reports processing once the upload settles', () => {
		render(
			<Editor
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'processing', progress: 100, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		// Scoped to the visible status line: the polite live region beside it
		// carries the same phase string.
		expect(
			screen.getByText( 'Upload complete — processing…', {
				selector: '.vp-upload-stage__status',
			} )
		).toBeInTheDocument();
	} );

	it( 'announces the upload phase without the percentage', () => {
		render(
			<Editor
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'uploading', progress: 42, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		// The percentage must stay OUT of the live region: it changes on every
		// progress event, and `aria-live` on the wrapper made a screen reader
		// speak a new number each time. The upload pill, which announces the
		// same way, is suppressed on /upload and cannot cover for this.
		// An exact-text match finds the phase-only node, not "Uploading… 42%".
		const live = screen.getByText( 'Uploading…' );
		expect( live ).toHaveAttribute( 'aria-live', 'polite' );
		expect( live ).not.toHaveTextContent( '42%' );
		// The percentage is still shown, just outside the live region.
		expect( screen.getByText( 'Uploading… 42%' ) ).toBeInTheDocument();
	} );

	it( 'surfaces a failure with its retry, keeping the form in place', async () => {
		const user = userEvent.setup();
		const onRetry = jest.fn();
		render(
			<Editor
				{ ...editorProps( draftVideo, {
					uploadState: {
						status: 'failed',
						progress: 30,
						fileName: 'clip.mp4',
						error: 'The connection dropped.',
						onRetry,
					},
					saveDisabled: true,
				} ) }
			/>
		);

		expect( screen.getByRole( 'alert' ) ).toHaveTextContent( 'The connection dropped.' );
		await user.click( screen.getByRole( 'button', { name: 'Retry upload' } ) );
		expect( onRetry ).toHaveBeenCalledTimes( 1 );

		// The failure lives in the player slot only — the form is untouched.
		expect( screen.getByLabelText( 'Title' ) ).toBeInTheDocument();
	} );

	// The end of an upload hands the slot straight back to the player: nothing
	// stands between the user and the video they just uploaded, and every share
	// action already has exactly one home elsewhere on the page.
	it( 'gives the player slot back to the player once the upload settles', () => {
		render(
			<Editor
				{ ...editorProps( makeLibraryItem(), {
					saveDisabled: false,
				} ) }
			/>
		);

		expect( screen.getByTestId( 'preview-player' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Your video is live' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Watch video' } ) ).not.toBeInTheDocument();
		// One copy-link control on the screen, in the info card — not two.
		expect( screen.queryByRole( 'button', { name: 'Copy link' } ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'video-info-card' ) ).toBeInTheDocument();
	} );

	// The /upload bridge renders inside DashboardLayout's AdminPage; /video/:id
	// has an upload session AND its own page chrome. One prop cannot mean both.
	it( 'keeps its page chrome for a non-embedded upload session', () => {
		render(
			<Editor
				{ ...editorProps( makeLibraryItem(), {
					uploadState: { status: 'processing', progress: 100, fileName: 'clip.mp4' },
					saveDisabled: false,
				} ) }
			/>
		);

		expect( screen.getByRole( 'navigation' ) ).toBeInTheDocument();
	} );

	it( 'drops the page chrome when embedded', () => {
		render(
			<Editor
				embedded
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'uploading', progress: 10, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		// AdminPage inside AdminPage renders a second masthead in the tab panel.
		expect( screen.queryByRole( 'navigation' ) ).not.toBeInTheDocument();
		// The embedded header's title stands in for the dropped masthead. Named
		// rather than counted: every card title is an h2 too, so a bare level-2
		// lookup would pass even if this heading disappeared.
		expect( screen.getByRole( 'heading', { level: 2, name: 'clip' } ) ).toBeInTheDocument();
		// The record is a synthetic draft id, so the chapters deep link would
		// point at a route that cannot resolve.
		expect(
			screen.queryByRole( 'link', { name: 'Edit chapters in the editor' } )
		).not.toBeInTheDocument();
	} );

	it( 'seeds the form from a draft carried in on the queue row', () => {
		render(
			<Editor
				{ ...editorProps( makeLibraryItem( { title: 'clip' } ), {
					saveDisabled: false,
					draft: { title: 'Launch week recap' },
				} ) }
			/>
		);

		expect( screen.getByLabelText( 'Title' ) ).toHaveValue( 'Launch week recap' );
		// Carried edits are unsaved against the server record, so Save is live.
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'writes the dirty-field diff back out as it is typed', async () => {
		const user = userEvent.setup();
		const onDraftChange = jest.fn();
		render(
			<Editor
				{ ...editorProps( makeLibraryItem( { title: 'clip' } ), {
					saveDisabled: false,
					onDraftChange,
				} ) }
			/>
		);

		// Clean on mount: nothing to carry.
		expect( onDraftChange ).toHaveBeenLastCalledWith( undefined );

		await user.type( screen.getByLabelText( 'Title' ), '!' );
		expect( onDraftChange ).toHaveBeenLastCalledWith( { title: 'clip!' } );

		// Typed back to the record's own value, so there is no longer a draft.
		await user.clear( screen.getByLabelText( 'Title' ) );
		await user.type( screen.getByLabelText( 'Title' ), 'clip' );
		expect( onDraftChange ).toHaveBeenLastCalledWith( undefined );
	} );

	it( 'warns before a reload drops unsaved edits', async () => {
		const user = userEvent.setup();
		render( <Editor { ...editorProps( makeLibraryItem() ) } /> );

		const clean = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( clean );
		expect( clean.defaultPrevented ).toBe( false );

		await user.type( screen.getByLabelText( 'Title' ), '!' );

		const dirty = new Event( 'beforeunload', { cancelable: true } );
		window.dispatchEvent( dirty );
		expect( dirty.defaultPrevented ).toBe( true );
	} );

	it( 'guards the parent breadcrumb against discarding a dirty form', async () => {
		const user = userEvent.setup();
		const confirmSpy = jest.spyOn( window, 'confirm' ).mockReturnValue( false );
		render( <Editor { ...editorProps( makeLibraryItem() ) } /> );

		await user.type( screen.getByLabelText( 'Title' ), '!' );
		const crumb = screen.getByRole( 'link', { name: 'VideoPress' } );
		const click = new MouseEvent( 'click', { bubbles: true, cancelable: true } );
		crumb.dispatchEvent( click );

		expect( confirmSpy ).toHaveBeenCalledWith(
			'You have unsaved changes. Leave this page and discard them?'
		);
		expect( click.defaultPrevented ).toBe( true );
		confirmSpy.mockRestore();
	} );

	it( 'keeps a half-typed title when the draft re-binds to the real record', async () => {
		const user = userEvent.setup();
		const session: EditorUploadSession = {
			uploadState: { status: 'uploading', progress: 10, fileName: 'clip.mp4' },
			saveDisabled: true,
		};
		const { rerender } = render( <Editor embedded { ...editorProps( draftVideo, session ) } /> );

		await user.clear( screen.getByLabelText( 'Title' ) );
		await user.type( screen.getByLabelText( 'Title' ), 'Launch week recap' );

		const realVideo = makeLibraryItem( {
			id: '77',
			guid: 'g77',
			title: 'clip',
			description: '',
		} );
		rerender(
			<Editor
				embedded
				{ ...editorProps( realVideo, {
					uploadState: { status: 'processing', progress: 100, fileName: 'clip.mp4' },
					saveDisabled: false,
				} ) }
			/>
		);

		// The typed title survives the id change, and — with the attachment
		// now real — its unsaved state is finally allowed to enable Save.
		expect( screen.getByLabelText( 'Title' ) ).toHaveValue( 'Launch week recap' );
		expect( screen.getByRole( 'button', { name: 'Save' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );
} );
