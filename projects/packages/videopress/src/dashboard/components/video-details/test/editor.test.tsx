import { render, screen } from '@testing-library/react';
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
jest.mock( '@wordpress/admin-ui', () => ( {
	Breadcrumbs: ( { items }: { items: { label: string }[] } ) => (
		<nav>{ items.map( item => item.label ).join( ' / ' ) }</nav>
	),
} ) );

// The celebration's copy button posts a snackbar through the notices store.
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
// live-celebration imports linkForVideo from this module, so the mock keeps
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

describe( 'Editor upload session', () => {
	it( 'stages the upload in the player slot and holds Save off', async () => {
		const user = userEvent.setup();
		render(
			<Editor
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'uploading', progress: 42, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		expect( screen.getByText( 'clip.mp4' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Uploading… 42%' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'preview-player' ) ).not.toBeInTheDocument();

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

	it( 'reports processing once the upload settles', () => {
		render(
			<Editor
				{ ...editorProps( draftVideo, {
					uploadState: { status: 'processing', progress: 100, fileName: 'clip.mp4' },
					saveDisabled: true,
				} ) }
			/>
		);

		expect( screen.getByText( 'Upload complete — processing…' ) ).toBeInTheDocument();
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

	it( 'shows the one-time celebration instead of the player and dismisses to it', async () => {
		const user = userEvent.setup();
		const onDismiss = jest.fn();
		render(
			<Editor
				{ ...editorProps( makeLibraryItem(), {
					celebration: { onDismiss },
					saveDisabled: false,
				} ) }
			/>
		);

		expect( screen.getByText( 'Your video is live' ) ).toBeInTheDocument();
		expect( screen.getByText( 'https://videopress.com/v/abc123' ) ).toBeInTheDocument();
		expect( screen.queryByTestId( 'preview-player' ) ).not.toBeInTheDocument();
		// The record is real now, so the GUID-dependent cards are back too.
		expect( screen.getByTestId( 'thumbnail-card' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'video-info-card' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Watch video' } ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'keeps a half-typed title when the draft re-binds to the real record', async () => {
		const user = userEvent.setup();
		const session: EditorUploadSession = {
			uploadState: { status: 'uploading', progress: 10, fileName: 'clip.mp4' },
			saveDisabled: true,
		};
		const { rerender } = render( <Editor { ...editorProps( draftVideo, session ) } /> );

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
