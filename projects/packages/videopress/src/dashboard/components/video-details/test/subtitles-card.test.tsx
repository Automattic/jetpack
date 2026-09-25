import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement, type ReactNode } from 'react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import SubtitlesCard from '../subtitles-card';

/*
 * Mocked so the card doesn't reach the network; the hook's fetch behavior is
 * covered by its own suite.
 */
let mockTracksResult: { managedTracks: unknown[]; isLoading: boolean } = {
	managedTracks: [],
	isLoading: false,
};
jest.mock( '../../../../client/components/caption-manager-modal/use-video-tracks', () => ( {
	useVideoTracks: () => mockTracksResult,
} ) );

const baseVideo = makeLibraryItem( { shortcode: '[videopress abc123]' } );

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
	mockTracksResult = { managedTracks: [], isLoading: false };
} );

describe( 'SubtitlesCard', () => {
	it( 'lists the subtitle languages and opens the manager', async () => {
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
		render( <SubtitlesCard video={ baseVideo } onManageSubtitles={ onManageSubtitles } />, {
			wrapper,
		} );

		// Chapters are not subtitles; only the caption/subtitle languages show.
		expect( screen.getByText( 'English (US), German' ) ).toBeInTheDocument();

		await user.click( screen.getByRole( 'button', { name: 'Manage subtitles' } ) );
		expect( onManageSubtitles ).toHaveBeenCalledTimes( 1 );
	} );

	// The button used to read "Manage", with the real string only in an
	// aria-label. Once the row left the card that labelled it, the visible
	// text had to carry the meaning on its own.
	it( 'spells out the action in visible text, not only in the accessible name', () => {
		render( <SubtitlesCard video={ baseVideo } onManageSubtitles={ jest.fn() } />, { wrapper } );

		expect( screen.getByRole( 'button', { name: 'Manage subtitles' } ) ).toHaveTextContent(
			'Manage subtitles'
		);
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
		render( <SubtitlesCard video={ baseVideo } onManageSubtitles={ jest.fn() } />, { wrapper } );

		expect( screen.getByText( 'English (US), German, and 2 more' ) ).toBeInTheDocument();
	} );

	it( 'says "No subtitles yet." when the video has no subtitle tracks', () => {
		render( <SubtitlesCard video={ baseVideo } onManageSubtitles={ jest.fn() } />, { wrapper } );

		expect( screen.getByText( 'Subtitles' ) ).toBeInTheDocument();
		expect( screen.getByText( 'No subtitles yet.' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing for items without a VideoPress GUID', () => {
		const { container } = render(
			<SubtitlesCard video={ { ...baseVideo, guid: undefined } } onManageSubtitles={ jest.fn() } />,
			{ wrapper }
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
