import { render, screen } from '@testing-library/react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import VideoInfoCard from '../video-info-card';

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
	filename: 'holiday-clip.mp4',
	shortcode: '[videopress abc123]',
	uploadDate: '2026-01-01T00:00:00',
} );

beforeEach( () => {
	mockSuccessNotice.mockReset();
	mockErrorNotice.mockReset();
} );

describe( 'VideoInfoCard', () => {
	it( 'renders the four values that address the video', () => {
		render( <VideoInfoCard video={ baseVideo } /> );

		expect( screen.getByLabelText( 'Link to video' ) ).toHaveValue(
			'https://videopress.com/v/abc123'
		);
		expect( screen.getByLabelText( 'Shortcode' ) ).toHaveValue( '[videopress abc123]' );
		expect( screen.getByText( 'File name' ) ).toBeInTheDocument();
		expect( screen.getByText( 'holiday-clip.mp4' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Uploaded on' ) ).toBeInTheDocument();
	} );

	// Private videos are served from a different host, and the link is the
	// thing people copy out of this card.
	it( 'links a private video to video.wordpress.com', () => {
		render( <VideoInfoCard video={ { ...baseVideo, isPrivate: true } } /> );

		expect( screen.getByLabelText( 'Link to video' ) ).toHaveValue(
			'https://video.wordpress.com/v/abc123'
		);
	} );

	// Both left this card: "Add to a post or page" moved to the page header,
	// and Subtitles got a card of its own on the canvas. The copy buttons stay
	// — copying a read-out is part of reading it. Neither of the other two
	// should quietly reappear here.
	it( 'no longer carries the subtitles row or the add-to-content menu', () => {
		render( <VideoInfoCard video={ baseVideo } /> );

		expect( screen.queryByText( 'Subtitles' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: /manage subtitles/i } ) ).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /add to a post or page/i } )
		).not.toBeInTheDocument();
	} );
} );
