import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { makeLibraryItem } from '../../../../test-utils/library-item';
import { mockApiFetch } from '../../../../test-utils/mock-api-fetch';
import { createTestWrapper } from '../../../../test-utils/query-client-wrapper';
import { createEditSession } from '../../state/edit-session';
import StudioEditorPreviewPlayer from '../preview-player';
import type { StudioEditorPreviewPlayerHandle } from '../preview-player';
import type { ComponentProps } from 'react';

const VIDEO_TESTID = 'studio-editor-preview-video';

// jsdom's media element implements neither play() nor pause(); stub them to
// fire the events a real element would so the hook's state machine runs.
beforeEach( () => {
	mockApiFetch( () => ( {} ) );
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
} );

const defaultProps = {
	video: makeLibraryItem( { sourceUrl: 'https://example.com/clip.mp4', durationSeconds: 60 } ),
	session: createEditSession( 60000 ),
};

/**
 * Render the player inside a QueryClient wrapper.
 *
 * @param overrides - Prop overrides for this test.
 * @return The render result plus the imperative handle.
 */
function renderPlayer(
	overrides: Partial< ComponentProps< typeof StudioEditorPreviewPlayer > > = {}
) {
	const ref = createRef< StudioEditorPreviewPlayerHandle >();
	const view = render(
		<StudioEditorPreviewPlayer { ...defaultProps } { ...overrides } ref={ ref } />,
		{
			wrapper: createTestWrapper(),
		}
	);
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

describe( 'StudioEditorPreviewPlayer', () => {
	it( 'plays a public video straight from sourceUrl', () => {
		renderPlayer();
		expect( getVideo() ).toHaveAttribute( 'src', 'https://example.com/clip.mp4' );
	} );

	it( 'signs a private video with the playback token', async () => {
		mockApiFetch( () => ( { playback_token: 'tok123' } ) );
		renderPlayer( {
			video: makeLibraryItem( {
				sourceUrl: 'https://example.com/clip.mp4',
				isPrivate: true,
				privacy: 'private',
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
	} );

	it( 'explains when the item has no playable source', () => {
		renderPlayer( { video: makeLibraryItem( { sourceUrl: undefined } ) } );
		expect( screen.queryByTestId( VIDEO_TESTID ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'This video has no playable source.' ) ).toBeInTheDocument();
	} );

	it( 'renders a bare stage: the transport lives in the timeline toolbar', () => {
		renderPlayer();
		// No play/pause button, no editable timecode, no duration label — the
		// timeline toolbar owns all of them per the editor redesign.
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
		expect( alert.closest( '.vp-studio-editor-preview__stage' ) ).not.toBeNull();
	} );

	it( 'exposes seekTo through the imperative handle', () => {
		const onTimeUpdate = jest.fn();
		const { ref } = renderPlayer( { onTimeUpdate } );
		act( () => ref.current?.seekTo( 1500 ) );
		expect( getVideo().currentTime ).toBe( 1.5 );
		expect( onTimeUpdate ).toHaveBeenLastCalledWith( 1500 );
	} );
} );
