import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import ChaptersPreviewPlayer from '../preview-player';
import type { ChaptersPreviewPlayerHandle, ChaptersPreviewVideo } from '../preview-player';
import type { ComponentProps } from 'react';

const VIDEO_TESTID = 'chapters-preview-video';

// The playback JWT is minted through getMediaToken (admin-ajax + localStorage
// cache); stub it so no request escapes jsdom and tests control the token.
const mockGetMediaToken = jest.fn();
jest.mock( '../../../../lib/get-media-token', () => ( {
	__esModule: true,
	default: ( ...args: unknown[] ) => mockGetMediaToken( ...args ),
} ) );

// jsdom's media element implements neither play() nor pause(); stub them to
// fire the events a real element would so the hook's state machine runs.
beforeEach( () => {
	mockGetMediaToken.mockResolvedValue( { token: null } );
	jest.spyOn( window.HTMLMediaElement.prototype, 'play' ).mockImplementation( function (
		this: HTMLMediaElement
	) {
		// Flip `paused` too: jsdom's is a constant true, which would trip the
		// hook's external-pause detection in the rAF loop.
		Object.defineProperty( this, 'paused', { configurable: true, get: () => false } );
		this.dispatchEvent( new Event( 'play' ) );
		return Promise.resolve();
	} );
	jest.spyOn( window.HTMLMediaElement.prototype, 'pause' ).mockImplementation( function (
		this: HTMLMediaElement
	) {
		Object.defineProperty( this, 'paused', { configurable: true, get: () => true } );
		this.dispatchEvent( new Event( 'pause' ) );
	} );
} );

afterEach( () => {
	jest.restoreAllMocks();
	mockGetMediaToken.mockReset();
} );

/**
 * Build a ChaptersPreviewVideo test fixture. Defaults model a public video
 * with a playable original; pass overrides for the fields under test.
 *
 * @param overrides - Fields to override on the base fixture.
 * @return A complete ChaptersPreviewVideo.
 */
function makeVideo( overrides: Partial< ChaptersPreviewVideo > = {} ): ChaptersPreviewVideo {
	return {
		guid: 'abc123',
		isPrivate: false,
		durationSeconds: 60,
		sourceUrl: 'https://example.com/clip.mp4',
		...overrides,
	};
}

const defaultProps = {
	video: makeVideo(),
};

/**
 * Render the player.
 *
 * @param overrides - Prop overrides for this test.
 * @return The render result plus the imperative handle.
 */
function renderPlayer( overrides: Partial< ComponentProps< typeof ChaptersPreviewPlayer > > = {} ) {
	const ref = createRef< ChaptersPreviewPlayerHandle >();
	const view = render( <ChaptersPreviewPlayer { ...defaultProps } { ...overrides } ref={ ref } /> );
	return { ...view, ref };
}

/**
 * The rendered <video> element.
 *
 * @return The video element.
 */
function getVideo(): HTMLVideoElement {
	return screen.getByTestId( VIDEO_TESTID ) as HTMLVideoElement;
}

describe( 'ChaptersPreviewPlayer', () => {
	it( 'plays a public video straight from sourceUrl', () => {
		renderPlayer();
		expect( getVideo() ).toHaveAttribute( 'src', 'https://example.com/clip.mp4' );
		// Public videos never mint a playback token.
		expect( mockGetMediaToken ).not.toHaveBeenCalled();
	} );

	it( 'prefers the transcoded rendition when playbackUrl is present', () => {
		renderPlayer( {
			video: makeVideo( {
				sourceUrl: 'https://example.com/original.mov',
				playbackUrl: 'https://videos.files.wordpress.com/abc123/clip_hd.mp4',
			} ),
		} );
		expect( getVideo() ).toHaveAttribute(
			'src',
			'https://videos.files.wordpress.com/abc123/clip_hd.mp4'
		);
	} );

	it( 'signs a private video with the playback token', async () => {
		mockGetMediaToken.mockResolvedValue( { token: 'tok123' } );
		renderPlayer( {
			video: makeVideo( {
				sourceUrl: 'https://example.com/clip.mp4',
				isPrivate: true,
			} ),
		} );
		// No unsigned request while the token is in flight.
		expect( screen.queryByTestId( VIDEO_TESTID ) ).not.toBeInTheDocument();
		await waitFor( () =>
			expect( getVideo() ).toHaveAttribute(
				'src',
				'https://example.com/clip.mp4?metadata_token=tok123'
			)
		);
		expect( mockGetMediaToken ).toHaveBeenCalledWith( 'playback', { guid: 'abc123' } );
	} );

	it( 'explains when the item has no playable source', () => {
		renderPlayer( { video: makeVideo( { sourceUrl: undefined } ) } );
		expect( screen.queryByTestId( VIDEO_TESTID ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'This video has no playable source.' ) ).toBeInTheDocument();
	} );

	it( 'renders a bare stage: the transport lives in the timeline toolbar', () => {
		renderPlayer();
		// No play/pause button, no editable timecode, no duration label — the
		// timeline toolbar owns all of them.
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'textbox' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( '/ 0:01:00.0' ) ).not.toBeInTheDocument();
	} );

	it( 'reports playing state changes through onPlayingChange', async () => {
		const onPlayingChange = jest.fn();
		const { ref } = renderPlayer( { onPlayingChange } );
		// The mount effect reports the initial paused state.
		expect( onPlayingChange ).toHaveBeenLastCalledWith( false );

		act( () => ref.current?.play() );
		await waitFor( () => expect( onPlayingChange ).toHaveBeenLastCalledWith( true ) );

		act( () => ref.current?.pause() );
		await waitFor( () => expect( onPlayingChange ).toHaveBeenLastCalledWith( false ) );
	} );

	it( 'overlays playback errors on the stage', async () => {
		const error = new Error( 'unsupported' );
		error.name = 'NotSupportedError';
		jest
			.spyOn( window.HTMLMediaElement.prototype, 'play' )
			.mockImplementation( () => Promise.reject( error ) );
		const { ref } = renderPlayer();

		act( () => ref.current?.play() );

		const alert = await screen.findByRole( 'alert' );
		expect( alert ).toHaveTextContent( 'This video format is not supported by the browser.' );
		// The overlay sits inside the stage, over the video surface.
		// eslint-disable-next-line testing-library/no-node-access -- asserting the overlay's ancestor requires DOM traversal.
		expect( alert.closest( '.vp-chapters-preview__stage' ) ).not.toBeNull();
	} );

	it( 'exposes seekTo through the imperative handle', () => {
		const onTimeUpdate = jest.fn();
		const { ref } = renderPlayer( { onTimeUpdate } );
		act( () => ref.current?.seekTo( 1500 ) );
		expect( getVideo().currentTime ).toBe( 1.5 );
		expect( onTimeUpdate ).toHaveBeenLastCalledWith( 1500 );
	} );
} );
