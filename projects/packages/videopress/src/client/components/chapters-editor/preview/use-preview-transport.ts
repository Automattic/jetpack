/**
 * The wiring between the chapters preview player and the chapters timeline,
 * shared by both hosts (the dashboard's Editor tab and the block editor's
 * chapter manager modal).
 *
 * The player owns playback; the timeline needs the live playhead, the play
 * state its transport button draws from, and imperative seek/toggle. This
 * hook holds that mirrored state plus the stable callbacks each side binds
 * to — including the scrub gesture's pause/resume, which keeps every
 * pointer-move seek landing on a paused element instead of fighting ongoing
 * playback (playback resumes after the drag, YouTube-style, when it was
 * running).
 */
import { useCallback, useRef, useState } from 'react';
import type { ChaptersPreviewPlayerHandle } from './preview-player';
import type { RefObject } from 'react';

/**
 * State and callbacks returned by {@link usePreviewTransport}.
 */
export interface PreviewTransport {
	/** Ref for the preview player's imperative handle. */
	playerRef: RefObject< ChaptersPreviewPlayerHandle >;
	/** Live playhead position in ms, mirrored from the player. */
	currentMs: number;
	/** Whether playback is running, mirrored from the player. */
	playing: boolean;
	/** The player's `onTimeUpdate`. */
	onTimeUpdate: ( ms: number ) => void;
	/** The player's `onPlayingChange`. */
	onPlayingChange: ( next: boolean ) => void;
	/** The timeline's `onSeek`. */
	onSeek: ( ms: number ) => void;
	/** The timeline's `onTogglePlay` (also the space-bar shortcut). */
	onTogglePlay: () => void;
	/** The timeline's `onScrubStart`: pause for the duration of the drag. */
	onScrubStart: () => void;
	/** The timeline's `onScrubEnd`: resume when the drag interrupted playback. */
	onScrubEnd: () => void;
	/** Drop the mirrored state, for hosts that re-open onto another video. */
	reset: () => void;
}

/**
 * Own the preview player ↔ timeline transport wiring.
 *
 * @return The mirrored playback state and the callbacks both sides bind to.
 */
export function usePreviewTransport(): PreviewTransport {
	const playerRef = useRef< ChaptersPreviewPlayerHandle >( null );
	const [ currentMs, setCurrentMs ] = useState( 0 );
	const [ playing, setPlaying ] = useState( false );

	const onTimeUpdate = useCallback( ( ms: number ) => setCurrentMs( ms ), [] );
	const onSeek = useCallback( ( ms: number ) => playerRef.current?.seekTo( ms ), [] );
	const onTogglePlay = useCallback( () => playerRef.current?.togglePlay(), [] );

	const scrubWasPlayingRef = useRef( false );
	const onScrubStart = useCallback( () => {
		scrubWasPlayingRef.current = playerRef.current?.isPlaying() ?? false;
		playerRef.current?.pause();
	}, [] );
	const onScrubEnd = useCallback( () => {
		if ( scrubWasPlayingRef.current ) {
			scrubWasPlayingRef.current = false;
			playerRef.current?.play();
		}
	}, [] );

	const reset = useCallback( () => {
		setCurrentMs( 0 );
		setPlaying( false );
	}, [] );

	return {
		playerRef,
		currentMs,
		playing,
		onTimeUpdate,
		onPlayingChange: setPlaying,
		onSeek,
		onTogglePlay,
		onScrubStart,
		onScrubEnd,
		reset,
	};
}
