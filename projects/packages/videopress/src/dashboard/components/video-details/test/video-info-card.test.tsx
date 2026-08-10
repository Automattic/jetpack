import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import VideoInfoCard from '../video-info-card';

/*
 * Mocked so the subtitles row doesn't reach the network; the hook's fetch
 * behavior is covered by its own suite.
 */
let mockTracksResult: { managedTracks: unknown[]; isLoading: boolean } = {
	managedTracks: [],
	isLoading: false,
};
jest.mock( '../../../../client/components/caption-manager-modal/use-video-tracks', () => ( {
	useVideoTracks: () => mockTracksResult,
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
	mockSuccessNotice.mockReset();
	mockErrorNotice.mockReset();
	mockTracksResult = { managedTracks: [], isLoading: false };
} );

describe( 'VideoInfoCard — subtitles row', () => {
	it( 'lists the subtitle languages and opens the manager from the Manage action', async () => {
		const user = userEvent.setup();
		mockTracksResult = {
			managedTracks: [
				{ kind: 'captions', srcLang: 'en-US', label: '', src: 'en.vtt' },
				{ kind: 'subtitles', srcLang: 'de', label: 'German', src: 'de.vtt' },
				{ kind: 'chapters', srcLang: 'en', label: '', src: 'chapters.vtt' },
			],
			isLoading: false,
		};
		const onManageSubtitles = jest.fn();
		render( <VideoInfoCard video={ baseVideo } onManageSubtitles={ onManageSubtitles } />, {
			wrapper,
		} );

		// Chapters are not subtitles; only the caption/subtitle languages show.
		expect( screen.getByText( 'English (US), German' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Manage subtitles' } ) );
		expect( onManageSubtitles ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'collapses long language lists into the first two and a count', () => {
		mockTracksResult = {
			managedTracks: [
				{ kind: 'captions', srcLang: 'en-US', label: '', src: '' },
				{ kind: 'subtitles', srcLang: 'de', label: '', src: '' },
				{ kind: 'subtitles', srcLang: 'fr', label: '', src: '' },
				{ kind: 'subtitles', srcLang: 'es', label: '', src: '' },
			],
			isLoading: false,
		};
		render( <VideoInfoCard video={ baseVideo } onManageSubtitles={ jest.fn() } />, { wrapper } );

		expect( screen.getByText( 'English (US), German, and 2 more' ) ).toBeInTheDocument();
	} );

	it( 'shows None when the video has no subtitle tracks', () => {
		render( <VideoInfoCard video={ baseVideo } onManageSubtitles={ jest.fn() } />, { wrapper } );

		expect( screen.getByText( 'Subtitles' ) ).toBeInTheDocument();
		expect( screen.getByText( 'None' ) ).toBeInTheDocument();
	} );

	it( 'omits the row for items without a VideoPress GUID', () => {
		render(
			<VideoInfoCard video={ { ...baseVideo, guid: undefined } } onManageSubtitles={ jest.fn() } />,
			{ wrapper }
		);

		expect( screen.queryByText( 'Subtitles' ) ).not.toBeInTheDocument();
	} );
} );
