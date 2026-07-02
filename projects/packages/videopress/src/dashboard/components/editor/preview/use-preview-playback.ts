/**
 * Playback state for the Studio editor's preview player.
 *
 * Owns { currentMs, playing, durationMs } for a <video> element that plays
 * the ORIGINAL master file. While playing, a requestAnimationFrame loop reads
 * `currentTime` directly (smooth playhead instead of the ~4Hz `timeupdate`
 * event) and runs the {@link resolvePlayback} skip engine every frame: the
 * playhead is kept inside the trim window and, when cut preview is on, jumps
 * over cuts; reaching the end of the edited output pauses the element.
 *
 * While paused the resolver is NOT applied, so the user can scrub anywhere on
 * the master — including outside the trim window — to position edit handles.
 *
 * All millisecond values are integers on the original master timeline.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { resolvePlayback } from '../state/resolve-playback';
import type { EditSession } from '../state/edit-session';

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
	addEventListener: ( type: string, listener: () => void ) => void;
	removeEventListener: ( type: string, listener: () => void ) => void;
}

/**
 * Options for {@link usePreviewPlayback}.
 */
export interface UsePreviewPlaybackOptions {
	/** The edit session driving the skip engine. */
	session: EditSession;
	/** Whether cut skipping is active (trim bounds are always enforced). */
	previewCutsEnabled: boolean;
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
	/** Playhead position in master-timeline ms. */
	currentMs: number;
	/** Whether the element is currently playing. */
	playing: boolean;
	/** Master duration in ms (metadata, or the fallback until it loads). */
	durationMs: number;
	/** Callback ref: attach to the <video> element (or null to detach). */
	attachVideo: ( element: PreviewVideoElement | null ) => void;
	/** Start playback; restarts from the trim start when at the end. */
	play: () => void;
	/** Pause playback. */
	pause: () => void;
	/** Toggle between play and pause. */
	togglePlay: () => void;
	/** Seek to a master-timeline position (ms, clamped to the media). */
	seekTo: ( ms: number ) => void;
}

/**
 * Read an element's playhead as integer master-timeline ms.
 *
 * @param element - The video element.
 * @return The position in ms.
 */
function elementMs( element: PreviewVideoElement ): number {
	return Math.round( element.currentTime * 1000 );
}

/**
 * Own playback state for the editor's preview <video>.
 *
 * @param options - Session, cut-preview flag, and fallback duration.
 * @return Playback state and transport controls.
 */
export function usePreviewPlayback( options: UsePreviewPlaybackOptions ): PreviewPlayback {
	const { session, previewCutsEnabled, fallbackDurationMs = 0 } = options;

	const [ currentMs, setCurrentMs ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );
	const [ metadataDurationMs, setMetadataDurationMs ] = useState< number | null >( null );
	const durationMs = metadataDurationMs ?? Math.max( 0, Math.round( fallbackDurationMs ) );

	const videoRef = useRef< PreviewVideoElement | null >( null );
	const detachRef = useRef< ( () => void ) | null >( null );
	const frameRef = useRef< number | null >( null );
	// Mirrors of state/props so the rAF loop and stable callbacks always read
	// fresh values without re-subscribing element listeners.
	const playingRef = useRef( false );
	const sessionRef = useRef( session );
	const previewCutsRef = useRef( previewCutsEnabled );
	const durationRef = useRef( durationMs );
	sessionRef.current = session;
	previewCutsRef.current = previewCutsEnabled;
	durationRef.current = durationMs;

	const stopLoop = useCallback( () => {
		if ( frameRef.current !== null ) {
			cancelAnimationFrame( frameRef.current );
			frameRef.current = null;
		}
	}, [] );

	const tick = useCallback( function tickFrame() {
		frameRef.current = null;
		const video = videoRef.current;
		if ( ! video ) {
			return;
		}
		let ms = elementMs( video );
		const resolution = resolvePlayback( ms, sessionRef.current, previewCutsRef.current );
		if ( resolution.seekTo !== undefined ) {
			video.currentTime = resolution.seekTo / 1000;
			ms = resolution.seekTo;
		}
		setCurrentMs( ms );
		if ( resolution.ended ) {
			// The 'pause' listener clears `playing` and keeps the loop stopped.
			video.pause();
			return;
		}
		frameRef.current = requestAnimationFrame( tickFrame );
	}, [] );

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
				}
			};
			element.addEventListener( 'play', onPlay );
			element.addEventListener( 'pause', onPause );
			// Covers the master file physically running out, which the skip
			// engine can't preempt when the trim end sits at the very end.
			element.addEventListener( 'ended', onPause );
			// Keeps `currentMs` honest for seeks performed while paused (the
			// rAF loop only runs during playback).
			element.addEventListener( 'seeked', syncTime );
			element.addEventListener( 'loadedmetadata', onLoadedMetadata );
			detachRef.current = () => {
				element.removeEventListener( 'play', onPlay );
				element.removeEventListener( 'pause', onPause );
				element.removeEventListener( 'ended', onPause );
				element.removeEventListener( 'seeked', syncTime );
				element.removeEventListener( 'loadedmetadata', onLoadedMetadata );
			};

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
		const video = videoRef.current;
		if ( ! video ) {
			return;
		}
		const current = sessionRef.current;
		const resolution = resolvePlayback( elementMs( video ), current, previewCutsRef.current );
		// Replay from the top of the trim window when the output has ended;
		// otherwise honor any pre-roll snap (before the window / inside a cut)
		// so playback starts from where sound will actually come out.
		const startMs = resolution.ended ? current.trimStartMs : resolution.seekTo;
		if ( startMs !== undefined ) {
			video.currentTime = startMs / 1000;
			setCurrentMs( startMs );
		}
		// A rejected play() (autoplay policy, detach mid-flight) simply never
		// fires 'play', so state stays paused; swallow the rejection.
		video.play()?.catch( () => {} );
	}, [] );

	const pause = useCallback( () => {
		videoRef.current?.pause();
	}, [] );

	const togglePlay = useCallback( () => {
		if ( playingRef.current ) {
			pause();
		} else {
			play();
		}
	}, [ play, pause ] );

	const seekTo = useCallback( ( ms: number ) => {
		const bound = durationRef.current > 0 ? durationRef.current : sessionRef.current.durationMs;
		let clamped = Math.max( 0, Math.round( ms ) );
		if ( bound > 0 ) {
			clamped = Math.min( bound, clamped );
		}
		setCurrentMs( clamped );
		const video = videoRef.current;
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

	return { currentMs, playing, durationMs, attachVideo, play, pause, togglePlay, seekTo };
}
