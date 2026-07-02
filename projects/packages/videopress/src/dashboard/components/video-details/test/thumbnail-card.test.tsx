import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { selectImageFromMediaLibrary } from '../../../utils/select-image-from-media-library';
import ThumbnailCard from '../thumbnail-card';
import type { LibraryItem } from '../../../types/library';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

jest.mock( '../../../utils/select-image-from-media-library', () => ( {
	selectImageFromMediaLibrary: jest.fn(),
} ) );
const mockedSelectImage = selectImageFromMediaLibrary as unknown as jest.Mock;

jest.mock( '../select-frame-dialog', () => ( {
	__esModule: true,
	default: ( {
		isOpen,
		onClose,
		onConfirm,
	}: {
		isOpen: boolean;
		onClose: () => void;
		onConfirm: ( ms: number ) => void;
	} ) =>
		isOpen ? (
			<div data-testid="select-frame-dialog">
				<button onClick={ () => onConfirm( 1500 ) }>confirm-frame</button>
				<button onClick={ onClose }>close-frame</button>
			</div>
		) : null,
} ) );

// Variables referenced inside jest.mock() factories must be prefixed with "mock"
// (case-insensitive) to satisfy Jest's babel-jest hoisting restrictions.
const mockSuccessNotice = jest.fn();
const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createSuccessNotice: mockSuccessNotice,
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

// Stub the playlist modal body: its own behaviour is covered by the library
// tests; here we only care that the card mounts it with this video and wires
// closeModal back to the hosting dialog.
const mockPlaylistModalProps = jest.fn();
jest.mock( '../../library/add-to-playlist-modal', () => ( {
	__esModule: true,
	default: ( props: { items: unknown[]; closeModal?: () => void } ) => {
		mockPlaylistModalProps( props );
		return (
			<div data-testid="add-to-playlist-modal">
				<button onClick={ () => props.closeModal?.() }>close-playlist-modal</button>
			</div>
		);
	},
} ) );

const baseVideo: LibraryItem = {
	id: '42',
	guid: 'abc123',
	type: 'videopress',
	title: 'My video',
	filename: 'movie.mp4',
	thumbnailUrl: 'https://example.test/poster.jpg',
	durationSeconds: 60,
	uploadDate: '2026-01-01T00:00:00',
	privacy: 'public',
	isPrivate: false,
	fileSizeBytes: 0,
	upload: { status: 'idle', progress: 0 },
	description: '',
	rating: 'G',
	displayEmbed: true,
	allowDownloads: false,
	shortcode: '[videopress abc123]',
	sourceUrl: 'https://example.test/movie.mp4',
	isProcessing: false,
	playlistIds: [],
};

/**
 * Minimal React Query wrapper for tests.
 *
 * @param root0          - Component props.
 * @param root0.children - Child elements to render inside the provider.
 * @return The QueryClientProvider element.
 */
function wrapper( { children }: { children: ReactNode } ) {
	const client = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	return createElement( QueryClientProvider, { client }, children );
}

beforeEach( () => {
	mockedApiFetch.mockReset();
	mockedSelectImage.mockReset();
	mockSuccessNotice.mockReset();
	mockErrorNotice.mockReset();
	mockPlaylistModalProps.mockReset();
	// Provide window.wp.media so canUploadImage is true for upload-mode tests.
	( window as unknown as { wp?: { media?: unknown } } ).wp = { media: jest.fn() };
} );

afterEach( () => {
	delete ( window as unknown as { wp?: { media?: unknown } } ).wp;
} );

describe( 'ThumbnailCard — update flow', () => {
	it( 'renders the Update thumbnail button when video is editable', () => {
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );
		expect( screen.getByRole( 'button', { name: /update thumbnail/i } ) ).toBeInTheDocument();
	} );

	it( 'hides the Update thumbnail button while the video is processing', () => {
		render(
			<ThumbnailCard video={ { ...baseVideo, isProcessing: true } } onAddToNewPost={ jest.fn() } />,
			{ wrapper }
		);
		expect( screen.queryByRole( 'button', { name: /update thumbnail/i } ) ).not.toBeInTheDocument();
	} );

	it( 'hides the Update thumbnail button for local (non-VideoPress) items', () => {
		render(
			<ThumbnailCard
				video={ { ...baseVideo, type: 'local', guid: '' } }
				onAddToNewPost={ jest.fn() }
			/>,
			{ wrapper }
		);
		expect( screen.queryByRole( 'button', { name: /update thumbnail/i } ) ).not.toBeInTheDocument();
	} );

	it( 'frame mode: fires the mutation with at_time + is_millisec, shows a success toast', async () => {
		const user = userEvent.setup();
		mockedApiFetch.mockResolvedValueOnce( {} );
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /select from video/i } ) );
		await user.click( screen.getByText( 'confirm-frame' ) );

		await waitFor( () =>
			expect( mockedApiFetch ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/videopress/abc123/poster',
				method: 'POST',
				data: { at_time: 1500, is_millisec: true },
			} )
		);
		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockErrorNotice ).not.toHaveBeenCalled();
	} );

	it( 'upload mode: fires the mutation with poster_attachment_id, shows a success toast', async () => {
		const user = userEvent.setup();
		mockedApiFetch.mockResolvedValueOnce( {} );
		mockedSelectImage.mockResolvedValueOnce( { id: 17, url: 'x' } );
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );

		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		await waitFor( () =>
			expect( mockedApiFetch ).toHaveBeenCalledWith( {
				path: '/wpcom/v2/videopress/abc123/poster',
				method: 'POST',
				data: { poster_attachment_id: 17 },
			} )
		);
		await waitFor( () => expect( mockSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
	} );

	it( 'upload mode: no mutation when the user cancels the media library', async () => {
		const user = userEvent.setup();
		mockedSelectImage.mockResolvedValueOnce( null );
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );

		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		expect( mockedApiFetch ).not.toHaveBeenCalled();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'shows an error toast when the mutation fails', async () => {
		const user = userEvent.setup();
		mockedApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /select from video/i } ) );
		await user.click( screen.getByText( 'confirm-frame' ) );

		await waitFor( () => expect( mockErrorNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );
} );

describe( 'ThumbnailCard — add to playlist (Studio-gated)', () => {
	type InitialState = { features?: { studio?: boolean } };
	const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'does not render the button when the Studio flag is off', () => {
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );
		expect( screen.queryByRole( 'button', { name: 'Add to playlist' } ) ).not.toBeInTheDocument();
	} );

	it( 'does not render the button while the video is not idle, even with the flag on', () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		// Mirrors the library's isVideoPressIdle bulk-action gate: this route
		// renders any non-failed upload, but in-flight videos are not addable.
		render(
			<ThumbnailCard
				video={ { ...baseVideo, upload: { status: 'uploading', progress: 50 } } }
				onAddToNewPost={ jest.fn() }
			/>,
			{ wrapper }
		);
		expect( screen.queryByRole( 'button', { name: 'Add to playlist' } ) ).not.toBeInTheDocument();
	} );

	it( 'opens the dialog with this single video when the flag is on', async () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const user = userEvent.setup();
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );

		// Modal body mounts only while the dialog is open.
		expect( screen.queryByTestId( 'add-to-playlist-modal' ) ).not.toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Add to playlist' } ) );

		expect( screen.getByText( 'Add video to playlist' ) ).toBeInTheDocument();
		const modalBody = screen.getByTestId( 'add-to-playlist-modal' );
		expect( modalBody ).toBeInTheDocument();
		// Dialog.Popup is an unpadded flex column; the modal body must sit in
		// the Dialog.Content region (the overlay scroll container) for padding
		// and scrolling.
		// eslint-disable-next-line testing-library/no-node-access -- asserting an ancestor region requires DOM traversal.
		expect( modalBody.closest( '[data-wp-ui-overlay-scroll-container]' ) ).not.toBeNull();
		expect( mockPlaylistModalProps ).toHaveBeenCalledWith(
			expect.objectContaining( { items: [ baseVideo ] } )
		);
	} );

	it( 'closes the dialog when the modal invokes closeModal', async () => {
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		const user = userEvent.setup();
		render( <ThumbnailCard video={ baseVideo } onAddToNewPost={ jest.fn() } />, { wrapper } );

		await user.click( screen.getByRole( 'button', { name: 'Add to playlist' } ) );
		await user.click( screen.getByText( 'close-playlist-modal' ) );

		await waitFor( () =>
			expect( screen.queryByTestId( 'add-to-playlist-modal' ) ).not.toBeInTheDocument()
		);
	} );
} );
