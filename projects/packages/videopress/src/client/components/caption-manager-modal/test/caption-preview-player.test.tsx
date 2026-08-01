import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import CaptionPreviewPlayer from '../caption-preview-player';
import type { CaptionPreviewPlayerHandle, CueRange } from '../caption-preview-player';

jest.mock( 'debug', () => () => jest.fn() );
jest.mock( '../../../lib/get-media-token', () =>
	jest.fn( () => Promise.resolve( { token: 'playback-token' } ) )
);
jest.mock( '@wordpress/i18n', () => ( {
	__: ( text: string ) => text,
} ) );
jest.mock( '@wordpress/components', () => ( {
	CheckboxControl: ( {
		label,
		checked,
		onChange,
	}: {
		label: string;
		checked: boolean;
		onChange: ( value: boolean ) => void;
	} ) => (
		<input
			type="checkbox"
			aria-label={ label }
			checked={ checked }
			onChange={ event => onChange( event.target.checked ) }
		/>
	),
} ) );

const CUE_RANGES: CueRange[] = [
	{ start: 1, end: 3, text: 'First cue' },
	{ start: 5, end: 7, text: 'Second cue' },
];

const getVideo = (): HTMLVideoElement =>
	screen.getByLabelText( 'Video preview' ) as HTMLVideoElement;

const timeUpdate = ( video: HTMLVideoElement, seconds: number ) => {
	Object.defineProperty( video, 'currentTime', {
		configurable: true,
		writable: true,
		value: seconds,
	} );
	fireEvent.timeUpdate( video );
};

// jsdom does not implement HTMLMediaElement playback; emulate the parts the
// player relies on (the play() promise, the paused flag, play/pause events).
const stubNativePlayback = ( video: HTMLVideoElement ) => {
	const play = jest.fn( () => {
		Object.defineProperty( video, 'paused', { configurable: true, value: false } );
		fireEvent.play( video );
		return Promise.resolve();
	} );
	const pause = jest.fn( () => {
		Object.defineProperty( video, 'paused', { configurable: true, value: true } );
		fireEvent.pause( video );
	} );
	video.play = play;
	video.pause = pause;
	return { play, pause };
};

describe( 'CaptionPreviewPlayer', () => {
	describe( 'with a native video source', () => {
		const renderNativePlayer = ( cueRanges: CueRange[] = CUE_RANGES ) =>
			render(
				<CaptionPreviewPlayer
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ cueRanges }
				/>
			);

		it( 'overlays the cue under the playhead on timeupdate', () => {
			renderNativePlayer();

			timeUpdate( getVideo(), 2 );
			expect( screen.getByText( 'First cue' ) ).toBeInTheDocument();

			timeUpdate( getVideo(), 6 );
			expect( screen.queryByText( 'First cue' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Second cue' ) ).toBeInTheDocument();
		} );

		it( 'hands off between back-to-back cues at the shared boundary', () => {
			renderNativePlayer( [
				{ start: 1, end: 3, text: 'First cue' },
				{ start: 3, end: 5, text: 'Adjacent cue' },
			] );

			// End times are exclusive, so at exactly 3s only the next cue is active.
			timeUpdate( getVideo(), 3 );

			expect( screen.queryByText( 'First cue' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Adjacent cue' ) ).toBeInTheDocument();
		} );

		it( 'clears the overlay between cues', () => {
			renderNativePlayer();

			timeUpdate( getVideo(), 2 );
			timeUpdate( getVideo(), 4 );

			expect( screen.queryByText( 'First cue' ) ).not.toBeInTheDocument();
			expect( screen.queryByText( 'Second cue' ) ).not.toBeInTheDocument();
		} );

		it( 'refreshes the overlay when the cues change while paused', () => {
			const { rerender } = renderNativePlayer();

			timeUpdate( getVideo(), 2 );
			expect( screen.getByText( 'First cue' ) ).toBeInTheDocument();

			rerender(
				<CaptionPreviewPlayer
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ [ { start: 1, end: 3, text: 'Edited cue' } ] }
				/>
			);

			expect( screen.queryByText( 'First cue' ) ).not.toBeInTheDocument();
			expect( screen.getByText( 'Edited cue' ) ).toBeInTheDocument();
		} );

		it( 'updates the overlay and reports the time through the imperative handle', () => {
			const ref = createRef< CaptionPreviewPlayerHandle >();
			render(
				<CaptionPreviewPlayer
					ref={ ref }
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ CUE_RANGES }
				/>
			);

			act( () => ref.current?.seekTo( 6 ) );

			expect( getVideo().currentTime ).toBe( 6 );
			expect( ref.current?.getCurrentTime() ).toBe( 6 );
			expect( screen.getByText( 'Second cue' ) ).toBeInTheDocument();
		} );

		it( 'exposes play, pause and isPlaying through the imperative handle', () => {
			const ref = createRef< CaptionPreviewPlayerHandle >();
			render(
				<CaptionPreviewPlayer
					ref={ ref }
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ CUE_RANGES }
				/>
			);
			const { play, pause } = stubNativePlayback( getVideo() );

			expect( ref.current?.isPlaying() ).toBe( false );

			act( () => ref.current?.play() );
			expect( play ).toHaveBeenCalled();
			expect( ref.current?.isPlaying() ).toBe( true );

			act( () => ref.current?.pause() );
			expect( pause ).toHaveBeenCalled();
			expect( ref.current?.isPlaying() ).toBe( false );
		} );

		it( 'reports playback time in milliseconds through onTimeUpdate', () => {
			const onTimeUpdate = jest.fn();
			render(
				<CaptionPreviewPlayer
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ CUE_RANGES }
					onTimeUpdate={ onTimeUpdate }
				/>
			);

			timeUpdate( getVideo(), 2.5 );

			expect( onTimeUpdate ).toHaveBeenCalledWith( 2500 );
		} );

		it( 'reports play state transitions through onPlayingChange', () => {
			const onPlayingChange = jest.fn();
			render(
				<CaptionPreviewPlayer
					guid="abc123"
					videoSrc="https://example.com/video.mp4"
					cueRanges={ CUE_RANGES }
					onPlayingChange={ onPlayingChange }
				/>
			);

			fireEvent.play( getVideo() );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( true );

			fireEvent.pause( getVideo() );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( false );
		} );
	} );

	describe( 'with the VideoPress embed', () => {
		const postPlayerMessage = ( iframe: HTMLIFrameElement, data: Record< string, unknown > ) =>
			act( () => {
				window.dispatchEvent(
					new MessageEvent( 'message', {
						data,
						origin: 'https://videopress.com',
						source: iframe.contentWindow,
					} )
				);
			} );

		const postTimeUpdate = ( iframe: HTMLIFrameElement, milliseconds: number ) =>
			postPlayerMessage( iframe, { event: 'videopress_timeupdate', currentTimeMs: milliseconds } );

		it( 'overlays the cue for timeupdate messages from its own iframe', () => {
			render( <CaptionPreviewPlayer guid="abc123" cueRanges={ CUE_RANGES } /> );

			const iframe = screen.getByTitle( 'Video preview' );
			expect( iframe ).toHaveAttribute(
				'src',
				expect.stringContaining( 'https://videopress.com/embed/abc123' )
			);

			postTimeUpdate( iframe as HTMLIFrameElement, 2000 );
			expect( screen.getByText( 'First cue' ) ).toBeInTheDocument();
		} );

		it( 'ignores timeupdate messages from other windows', () => {
			render( <CaptionPreviewPlayer guid="abc123" cueRanges={ CUE_RANGES } /> );

			act( () => {
				window.dispatchEvent(
					new MessageEvent( 'message', {
						data: { event: 'videopress_timeupdate', currentTimeMs: 2000 },
						origin: 'https://videopress.com',
						source: null,
					} )
				);
			} );

			expect( screen.queryByText( 'First cue' ) ).not.toBeInTheDocument();
		} );

		it( 'reports embed time updates in milliseconds through onTimeUpdate', () => {
			const onTimeUpdate = jest.fn();
			render(
				<CaptionPreviewPlayer
					guid="abc123"
					cueRanges={ CUE_RANGES }
					onTimeUpdate={ onTimeUpdate }
				/>
			);

			postTimeUpdate( screen.getByTitle( 'Video preview' ) as HTMLIFrameElement, 2000 );

			expect( onTimeUpdate ).toHaveBeenCalledWith( 2000 );
		} );

		it( 'reports embed play state messages through onPlayingChange and isPlaying', () => {
			const onPlayingChange = jest.fn();
			const ref = createRef< CaptionPreviewPlayerHandle >();
			render(
				<CaptionPreviewPlayer
					ref={ ref }
					guid="abc123"
					cueRanges={ CUE_RANGES }
					onPlayingChange={ onPlayingChange }
				/>
			);
			const iframe = screen.getByTitle( 'Video preview' ) as HTMLIFrameElement;

			postPlayerMessage( iframe, { event: 'videopress_playing' } );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( true );
			expect( ref.current?.isPlaying() ).toBe( true );

			postPlayerMessage( iframe, { event: 'videopress_pause' } );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( false );
			expect( ref.current?.isPlaying() ).toBe( false );

			postPlayerMessage( iframe, { event: 'videopress_playing' } );
			postPlayerMessage( iframe, { event: 'videopress_ended' } );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( false );
			expect( ref.current?.isPlaying() ).toBe( false );
		} );

		it( 'flips isPlaying optimistically when driving the embed through the handle', () => {
			const onPlayingChange = jest.fn();
			const ref = createRef< CaptionPreviewPlayerHandle >();
			render(
				<CaptionPreviewPlayer ref={ ref } guid="abc123" onPlayingChange={ onPlayingChange } />
			);

			act( () => ref.current?.play() );
			expect( ref.current?.isPlaying() ).toBe( true );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( true );

			act( () => ref.current?.pause() );
			expect( ref.current?.isPlaying() ).toBe( false );
			expect( onPlayingChange ).toHaveBeenLastCalledWith( false );
		} );
	} );
} );
