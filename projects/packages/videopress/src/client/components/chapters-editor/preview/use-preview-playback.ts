/**
 * Playback state for the chapters editors' preview player.
 *
 * Owns { currentMs, playing, durationMs } for a <video> element. While
 * playing, a requestAnimationFrame loop reads `currentTime` directly (smooth
 * playhead instead of the ~4Hz `timeupdate` event); reaching the media's end
 * fires the element's own 'ended' event, which pauses the state machine.
 *
 * Adapted from the Studio editor's preview-playback hook with the edit
 * session's skip engine removed: chapters play the video as-is (identity
 * playback), so the per-frame resolver had nothing left to resolve.
 *
 * All millisecond values are integers on the video's timeline.
 */
import { __, _x } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The subset of HTMLVideoElement the hook needs. Kept minimal so tests can
 * inject a scripted fake (jsdom's <video> is inert: no metadata, no playback).
 */
export interface PreviewVideoElement {
	/** Playback position in seconds. Assigning seeks the element. */
	currentTime: number;
	/** Media duration in seconds; NaN until metadata loads. */
	duration: number;
	/** Whether the element is paused. */
	paused: boolean;
	/** Start playback. Real elements return a promise that can reject. */
	play: () => Promise< void > | undefined;
	/** Pause playback. */
	pause: () => void;
	/** The element's load/decode failure, if any. */
	error?: MediaError | null;
	addEventListener: ( type: string, listener: () => void ) => void;
	removeEventListener: ( type: string, listener: () => void ) => void;
}

/**
 * Options for {@link usePreviewPlayback}.
 */
export interface UsePreviewPlaybackOptions {
	/**
	 * Duration to report before the element's metadata loads (e.g. from the
	 * media REST item), in ms. The element's own metadata wins once known.
	 */
	fallbackDurationMs?: number;
}

/**
 * State and controls returned by {@link usePreviewPlayback}.
 */
export interface PreviewPlayback {
	/** Playhead position in ms. */
	currentMs: number;
	/** Whether the element is currently playing. */
	playing: boolean;
	/** Media duration in ms (metadata, or the fallback until it loads). */
	durationMs: number;
	/** Callback ref: attach to the <video> element (or null to detach). */
	attachVideo: ( element: PreviewVideoElement | null ) => void;
	/** Start playback; restarts from the beginning when at the end. */
	play: () => void;
	/** Pause playback. */
	pause: () => void;
	/** Toggle between play and pause. */
	togglePlay: () => void;
	/** Seek to a position (ms, clamped to the media). */
	seekTo: ( ms: number ) => void;
	/** Human-readable reason the media failed to load or play, or null. */
	playbackError: string | null;
}

/**
 * Describe a media element failure for the transport row.
 *
 * @param error - The element's MediaError, if any.
 * @return A short human-readable message.
 */
function mediaErrorMessage( error: MediaError | null ): string {
	switch ( error?.code ) {
		case MediaError.MEDIA_ERR_NETWORK:
			return __( 'The video could not be downloaded.', 'jetpack-videopress-pkg' );
		case MediaError.MEDIA_ERR_DECODE:
			return __( 'The browser could not decode this video.', 'jetpack-videopress-pkg' );
		case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
			return __( 'This video format is not supported by the browser.', 'jetpack-videopress-pkg' );
		default:
			return __( 'The video failed to load.', 'jetpack-videopress-pkg' );
	}
}

/**
 * Read an element's playhead as integer ms.
 *
 * @param element - The video element.
 * @return The position in ms.
 */
function elementMs( element: PreviewVideoElement ): number {
	return Math.round( element.currentTime * 1000 );
}

/**
 * Own playback state for the chapters preview <video>.
 *
 * @param options - The fallback duration.
 * @return Playback state and transport controls.
 */
export function usePreviewPlayback( options: UsePreviewPlaybackOptions = {} ): PreviewPlayback {
	const { fallbackDurationMs = 0 } = options;

	const [ currentMs, setCurrentMs ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ playbackError, setPlaybackError ] = useState< string | null >( null );
	const [ metadataDurationMs, setMetadataDurationMs ] = useState< number | null >( null );
	const durationMs = metadataDurationMs ?? Math.max( 0, Math.round( fallbackDurationMs ) );

	const videoRef = useRef< PreviewVideoElement | null >( null );
	const detachRef = useRef< ( () => void ) | null >( null );
	const frameRef = useRef< number | null >( null );

	// Resolve the element lazily: prefer the callback-ref value, but fall back
	// to the DOM. The router's fiber juggling has been observed leaving a live
	// instance whose ref callback ran against a sibling fiber, so the ref can
	// be empty while the element is right there on the page.
	const getVideo = useCallback( (): PreviewVideoElement | null => {
		if ( videoRef.current ) {
			return videoRef.current;
		}
		if ( typeof document !== 'undefined' ) {
			return document.querySelector< HTMLVideoElement >( '[data-testid="chapters-preview-video"]' );
		}
		return null;
	}, [] );
	// Mirrors of state so the rAF loop and stable callbacks always read
	// fresh values without re-subscribing element listeners.
	const playingRef = useRef( false );
	const durationRef = useRef( durationMs );
	durationRef.current = durationMs;

	const stopLoop = useCallback( () => {
		if ( frameRef.current !== null ) {
			cancelAnimationFrame( frameRef.current );
			frameRef.current = null;
		}
	}, [] );

	// Imperative state transitions. Media events are ALSO wired below, but
	// browsers can drop events dispatched before the first user-initiated
	// play() (observed on Chromium: loadedmetadata/seeked/play never delivered
	// to listeners until the media pipeline wakes), so our own transport calls
	// and the rAF loop drive the state and the events are only a safety net.
	const readDuration = useCallback( () => {
		const video = getVideo();
		if ( video && Number.isFinite( video.duration ) && video.duration > 0 ) {
			setMetadataDurationMs( Math.round( video.duration * 1000 ) );
		}
	}, [] );

	const markPaused = useCallback( () => {
		playingRef.current = false;
		setPlaying( false );
		stopLoop();
		const video = getVideo();
		if ( video ) {
			setCurrentMs( elementMs( video ) );
		}
	}, [ stopLoop ] );

	const tick = useCallback(
		function tickFrame() {
			frameRef.current = null;
			const video = getVideo();
			if ( ! video ) {
				return;
			}
			// External pause (media end, another script, OS media keys): reflect it.
			if ( video.paused ) {
				markPaused();
				return;
			}
			setCurrentMs( elementMs( video ) );
			frameRef.current = requestAnimationFrame( tickFrame );
		},
		[ markPaused ]
	);

	const startLoop = useCallback( () => {
		if ( frameRef.current === null ) {
			frameRef.current = requestAnimationFrame( tick );
		}
	}, [ tick ] );

	const attachVideo = useCallback(
		( element: PreviewVideoElement | null ) => {
			if ( videoRef.current === element ) {
				return;
			}
			detachRef.current?.();
			detachRef.current = null;
			stopLoop();
			videoRef.current = element;
			playingRef.current = false;

			if ( ! element ) {
				setPlaying( false );
				return;
			}

			const syncTime = () => setCurrentMs( elementMs( element ) );
			const onPlay = () => {
				playingRef.current = true;
				setPlaying( true );
				setPlaybackError( null );
				startLoop();
			};
			const onPause = () => {
				playingRef.current = false;
				setPlaying( false );
				stopLoop();
				syncTime();
			};
			const onLoadedMetadata = () => {
				if ( Number.isFinite( element.duration ) && element.duration > 0 ) {
					setMetadataDurationMs( Math.round( element.duration * 1000 ) );
					setPlaybackError( null );
				}
			};
			const onError = () => {
				setPlaybackError( mediaErrorMessage( element.error ?? null ) );
			};
			element.addEventListener( 'play', onPlay );
			element.addEventListener( 'pause', onPause );
			// Covers the media physically running out, which the rAF loop can't
			// preempt (it only reflects the element's own state).
			element.addEventListener( 'ended', onPause );
			// Keeps `currentMs` honest for seeks performed while paused (the
			// rAF loop only runs during playback).
			element.addEventListener( 'seeked', syncTime );
			element.addEventListener( 'loadedmetadata', onLoadedMetadata );
			element.addEventListener( 'error', onError );
			// Metadata can load before the listeners attach, and events fired
			// before the first user-initiated play() may never be delivered at
			// all — poll until the duration is known instead of trusting
			// 'loadedmetadata'.
			const metadataPoll = setInterval( () => {
				if ( element.error ) {
					onError();
					clearInterval( metadataPoll );
					return;
				}
				if ( Number.isFinite( element.duration ) && element.duration > 0 ) {
					onLoadedMetadata();
					clearInterval( metadataPoll );
				}
			}, 250 );
			detachRef.current = () => {
				clearInterval( metadataPoll );
				element.removeEventListener( 'play', onPlay );
				element.removeEventListener( 'pause', onPause );
				element.removeEventListener( 'ended', onPause );
				element.removeEventListener( 'seeked', syncTime );
				element.removeEventListener( 'loadedmetadata', onLoadedMetadata );
				element.removeEventListener( 'error', onError );
			};
			// The element may already sit in a failed state by attach time.
			if ( element.error ) {
				onError();
			}

			// Initial sync: the element may already have metadata (or even be
			// playing) by the time the ref attaches.
			onLoadedMetadata();
			syncTime();
			if ( element.paused ) {
				setPlaying( false );
			} else {
				onPlay();
			}
		},
		[ startLoop, stopLoop ]
	);

	const play = useCallback( () => {
		const video = getVideo();
		if ( ! video ) {
			return;
		}
		// Replay from the beginning when the media has ended (the identity
		// equivalent of the Studio player's replay-from-trim-start).
		const bound = durationRef.current;
		if ( bound > 0 && elementMs( video ) >= bound ) {
			video.currentTime = 0;
			setCurrentMs( 0 );
		}
		// Drive state from the play() promise, not the 'play' event (events
		// before the pipeline wakes can be dropped entirely). On rejection,
		// surface the reason instead of failing silently.
		video
			.play()
			?.then( () => {
				playingRef.current = true;
				setPlaying( true );
				setPlaybackError( null );
				readDuration();
				startLoop();
			} )
			.catch( ( error: unknown ) => {
				const name = error instanceof Error ? error.name : '';
				// _x (not __) for the second branch: Terser merges a ternary of
				// two identical calls into one call with a ternary argument,
				// which the i18n extractor can't see through.
				setPlaybackError(
					name === 'NotSupportedError'
						? __( 'This video format is not supported by the browser.', 'jetpack-videopress-pkg' )
						: _x(
								'Playback could not be started.',
								'chapters preview player error',
								'jetpack-videopress-pkg'
						  )
				);
			} );
	}, [ readDuration, startLoop ] );

	const pause = useCallback( () => {
		getVideo()?.pause();
		markPaused();
	}, [ markPaused ] );

	const togglePlay = useCallback( () => {
		if ( playingRef.current ) {
			pause();
		} else {
			play();
		}
	}, [ play, pause ] );

	const seekTo = useCallback( ( ms: number ) => {
		const bound = durationRef.current;
		let clamped = Math.max( 0, Math.round( ms ) );
		if ( bound > 0 ) {
			clamped = Math.min( bound, clamped );
		}
		setCurrentMs( clamped );
		const video = getVideo();
		if ( video ) {
			video.currentTime = clamped / 1000;
		}
	}, [] );

	// Detach listeners and stop the loop on unmount. React calls the callback
	// ref with null before unmount in the usual case; this covers hook
	// consumers that never hand the element back.
	useEffect( () => {
		return () => {
			detachRef.current?.();
			detachRef.current = null;
			videoRef.current = null;
			stopLoop();
		};
	}, [ stopLoop ] );

	return {
		currentMs,
		playing,
		durationMs,
		attachVideo,
		play,
		pause,
		togglePlay,
		seekTo,
		playbackError,
	};
}
