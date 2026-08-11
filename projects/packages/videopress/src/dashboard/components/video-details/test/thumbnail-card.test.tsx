import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { selectImageFromMediaLibrary } from '../../../utils/select-image-from-media-library';
import ThumbnailCard from '../thumbnail-card';

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

// `sourceUrl` is what makes the "Select from video" mode available.
const baseVideo = makeLibraryItem( {
	thumbnailUrl: 'https://example.test/poster.jpg',
	durationSeconds: 60,
	shortcode: '[videopress abc123]',
	sourceUrl: 'https://example.test/movie.mp4',
} );

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
	// Provide window.wp.media so canUploadImage is true for upload-mode tests.
	( window as unknown as { wp?: { media?: unknown } } ).wp = { media: jest.fn() };
} );

afterEach( () => {
	delete ( window as unknown as { wp?: { media?: unknown } } ).wp;
} );

describe( 'ThumbnailCard — update flow', () => {
	it( 'renders the Update thumbnail button when video is editable', () => {
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );
		expect( screen.getByRole( 'button', { name: /update thumbnail/i } ) ).toBeInTheDocument();
	} );

	it( 'hides the Update thumbnail button while the video is processing', () => {
		render( <ThumbnailCard video={ { ...baseVideo, isProcessing: true } } />, { wrapper } );
		expect( screen.queryByRole( 'button', { name: /update thumbnail/i } ) ).not.toBeInTheDocument();
	} );

	it( 'hides the Update thumbnail button for local (non-VideoPress) items', () => {
		render( <ThumbnailCard video={ { ...baseVideo, type: 'local', guid: '' } } />, { wrapper } );
		expect( screen.queryByRole( 'button', { name: /update thumbnail/i } ) ).not.toBeInTheDocument();
	} );

	it( 'frame mode: fires the mutation with at_time + is_millisec, shows a success toast', async () => {
		const user = userEvent.setup();
		mockedApiFetch.mockResolvedValueOnce( {} );
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );
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
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );

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
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );

		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /upload image/i } ) );

		expect( mockedApiFetch ).not.toHaveBeenCalled();
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );

	it( 'shows an error toast when the mutation fails', async () => {
		const user = userEvent.setup();
		mockedApiFetch.mockRejectedValueOnce( new Error( 'boom' ) );
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );
		await user.click( screen.getByRole( 'button', { name: /update thumbnail/i } ) );
		await user.click( screen.getByRole( 'menuitem', { name: /select from video/i } ) );
		await user.click( screen.getByText( 'confirm-frame' ) );

		await waitFor( () => expect( mockErrorNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockSuccessNotice ).not.toHaveBeenCalled();
	} );
} );

// Showing the still next to the control that replaces it is the reason this
// is a card rather than the labelled lone button it used to be, so the image
// is worth pinning — particularly the private case, where rendering
// `thumbnailUrl` straight would give a broken image on every private video.
describe( 'ThumbnailCard — current poster', () => {
	it( 'renders the poster for a public video', () => {
		render( <ThumbnailCard video={ baseVideo } />, { wrapper } );

		expect( screen.getByRole( 'img', { name: /current thumbnail/i } ) ).toHaveAttribute(
			'src',
			'https://example.test/poster.jpg'
		);
		expect( mockedApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'waits for the playback token before rendering a private poster', async () => {
		let resolveToken: ( value: { playback_token: string } ) => void = () => {};
		mockedApiFetch.mockReturnValueOnce(
			new Promise< { playback_token: string } >( resolve => {
				resolveToken = resolve;
			} )
		);

		render( <ThumbnailCard video={ { ...baseVideo, isPrivate: true } } />, { wrapper } );

		// No <img> at all while the token is in flight — a src without the
		// token would 403 and render as a broken image.
		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();

		resolveToken( { playback_token: 'tok-123' } );

		await waitFor( () =>
			expect( screen.getByRole( 'img', { name: /current thumbnail/i } ) ).toHaveAttribute(
				'src',
				'https://example.test/poster.jpg?metadata_token=tok-123'
			)
		);
	} );

	it( 'renders no image when the video has no poster', () => {
		render( <ThumbnailCard video={ { ...baseVideo, thumbnailUrl: '' } } />, { wrapper } );

		expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();
		// The control is still there — a video with no poster is exactly the
		// one most in need of getting one.
		expect( screen.getByRole( 'button', { name: /update thumbnail/i } ) ).toBeInTheDocument();
	} );
} );
