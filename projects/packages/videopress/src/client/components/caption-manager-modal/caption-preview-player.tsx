/**
 * External dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import getMediaToken from '../../lib/get-media-token';
import { isAllowedOrigin } from '../../lib/videopress-allowed-origins';
import './caption-preview-player.scss';
/**
 * Types
 */
import type { VideoPressOrigin } from '../../lib/videopress-allowed-origins';
import type { CSSProperties, ForwardedRef, ReactElement } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal:preview-player' );

const PREVIEW_RESUME_DELAY_MS = 1200;
const DIRECT_VIDEO_SOURCE_REGEX = /\.(m4v|mov|mp4|ogv|webm)(?:[?#].*)?$/i;

const isDirectVideoSource = ( source?: string ) =>
	!! source && DIRECT_VIDEO_SOURCE_REGEX.test( source );

/*
 * Private videos are embedded from video.wordpress.com; both the iframe src
 * and the postMessage target origin derive from here so they always match.
 */
const getVideoPressEmbedOrigin = ( isPrivate?: boolean ): VideoPressOrigin =>
	isPrivate ? 'https://video.wordpress.com' : 'https://videopress.com';

const getVideoPressPreviewUrl = ( guid: string, isPrivate?: boolean, playbackToken?: string ) =>
	addQueryArgs( `${ getVideoPressEmbedOrigin( isPrivate ) }/embed/${ guid }`, {
		controls: true,
		resizeToParent: true,
		...( playbackToken ? { metadata_token: playbackToken } : {} ),
	} );

/**
 * A cue's pre-parsed time range and text, for the active-cue overlay lookup.
 */
export type CueRange = {
	start: number | null;
	end: number | null;
	text: string;
};

/**
 * Imperative controls the caption editor uses to drive the preview from its
 * keyboard shortcuts and typing handlers, plus the explicit play/pause
 * surface the chapter editor's transport and scrub handlers need.
 */
export type CaptionPreviewPlayerHandle = {
	seekTo: ( seconds: number ) => void;
	seekBy: ( seconds: number ) => void;
	togglePlayback: () => void;
	play: () => void;
	pause: () => void;
	isPlaying: () => boolean;
	getCurrentTime: () => number;
	pauseWhileTypingNow: () => void;
};

/**
 * The player's video-identifying props, which hosts pass through unchanged so
 * each workspace can render its own preview.
 */
export type CaptionPreviewProps = {
	guid: string;
	videoSrc?: string;
	poster?: string;
	isPrivate?: boolean;
	previewAspectRatio?: string;
};

const NO_CUE_RANGES: CueRange[] = [];

type CaptionPreviewPlayerProps = CaptionPreviewProps & {
	cueRanges?: CueRange[];
	/**
	 * Reports playback time from both backends in MILLISECONDS (the chapters
	 * editor contract; the native element and the embed both track seconds).
	 */
	onTimeUpdate?: ( milliseconds: number ) => void;
	/** Reports play/pause transitions from both backends. */
	onPlayingChange?: ( playing: boolean ) => void;
};

/**
 * Video preview for the caption editor.
 *
 * Plays either a direct video source (a native `<video>`) or the VideoPress
 * embed (an iframe driven over postMessage), tracks playback time to overlay
 * the cue under the playhead, and pauses playback while the author types.
 * Owning the playback time here keeps the per-timeupdate state churn out of
 * the modal, which would otherwise re-render every cue block several times a
 * second during playback.
 *
 * @param props                    - Component props.
 * @param props.guid               - VideoPress GUID, used for the embed player.
 * @param props.videoSrc           - Optional direct video source.
 * @param props.poster             - Optional poster image for the native player.
 * @param props.isPrivate          - Whether the video is private, so the embed needs a playback token.
 * @param props.previewAspectRatio - Aspect ratio (`W / H`) to size the frame.
 * @param props.cueRanges          - Pre-parsed cue ranges for the active-cue overlay.
 * @param props.onTimeUpdate       - Reports playback time in milliseconds, from both backends.
 * @param props.onPlayingChange    - Reports play/pause transitions, from both backends.
 * @param ref                      - Imperative playback controls.
 * @return The preview panel.
 */
function CaptionPreviewPlayer(
	{
		guid,
		videoSrc,
		poster,
		isPrivate,
		previewAspectRatio,
		cueRanges = NO_CUE_RANGES,
		onTimeUpdate,
		onPlayingChange,
	}: CaptionPreviewPlayerProps,
	ref: ForwardedRef< CaptionPreviewPlayerHandle >
): ReactElement {
	const videoRef = useRef< HTMLVideoElement >( null );
	const playerIframeRef = useRef< HTMLIFrameElement >( null );
	const previewResumeTimerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const shouldResumePreviewAfterTypingRef = useRef( false );
	const currentTimeRef = useRef( 0 );
	const cueRangesRef = useRef( cueRanges );
	cueRangesRef.current = cueRanges;
	// Callback props are read through refs so the time/playing plumbing stays
	// referentially stable regardless of how hosts memoize their callbacks.
	const onTimeUpdateRef = useRef( onTimeUpdate );
	onTimeUpdateRef.current = onTimeUpdate;
	const onPlayingChangeRef = useRef( onPlayingChange );
	onPlayingChangeRef.current = onPlayingChange;
	const [ activeCueText, setActiveCueText ] = useState< string | undefined >( undefined );
	const [ isPreviewPlaying, setIsPreviewPlaying ] = useState( false );
	const [ pauseWhileTyping, setPauseWhileTyping ] = useState( true );
	// null = token fetch pending, '' = failed or not needed, string = minted token.
	const [ playbackToken, setPlaybackToken ] = useState< string | null >( null );

	const updateCurrentTime = useCallback( ( seconds: number ) => {
		currentTimeRef.current = seconds;
		// WebVTT end times are exclusive, so back-to-back cues hand off cleanly at the boundary.
		const activeCue = cueRangesRef.current.find(
			( { start, end } ) => start !== null && end !== null && seconds >= start && seconds < end
		);
		setActiveCueText( activeCue?.text );
		// Playback time is tracked in seconds (both backends' unit); the
		// chapters contract reports milliseconds.
		onTimeUpdateRef.current?.( seconds * 1000 );
	}, [] );

	// Single funnel for play-state transitions from both backends, so state
	// and the host's onPlayingChange can never disagree.
	const markPlaying = useCallback( ( playing: boolean ) => {
		setIsPreviewPlaying( playing );
		onPlayingChangeRef.current?.( playing );
	}, [] );

	// Refresh the overlay when the cues themselves change, e.g. edits while paused.
	useEffect( () => {
		updateCurrentTime( currentTimeRef.current );
	}, [ cueRanges, updateCurrentTime ] );

	const clearPreviewResumeTimer = useCallback( () => {
		if ( previewResumeTimerRef.current ) {
			clearTimeout( previewResumeTimerRef.current );
			previewResumeTimerRef.current = null;
		}
	}, [] );

	const postPreviewPlayerMessage = useCallback(
		( message: Record< string, unknown > ) => {
			playerIframeRef.current?.contentWindow?.postMessage(
				message,
				getVideoPressEmbedOrigin( isPrivate )
			);
		},
		[ isPrivate ]
	);

	/*
	 * Private videos require a playback token on the embed URL. Mint one when
	 * needed; if minting fails, fall back to the tokenless embed.
	 */
	useEffect( () => {
		if ( ! isPrivate ) {
			return;
		}

		let isCurrent = true;
		getMediaToken( 'playback', { guid } )
			.then( tokenData => {
				if ( isCurrent ) {
					setPlaybackToken( tokenData?.token || '' );
				}
			} )
			.catch( error => {
				debug( 'playback token error', error );
				if ( isCurrent ) {
					setPlaybackToken( '' );
				}
			} );

		return () => {
			isCurrent = false;
		};
	}, [ guid, isPrivate ] );

	/*
	 * Resume playback that was paused while the author was typing, for whichever
	 * player is active (native video or the embed iframe).
	 */
	const resumePreviewPlayback = useCallback( () => {
		if ( ! shouldResumePreviewAfterTypingRef.current ) {
			return;
		}

		shouldResumePreviewAfterTypingRef.current = false;
		const video = videoRef.current;
		if ( video?.paused ) {
			video.play().catch( error => debug( 'resume preview after typing error', error ) );
		} else if ( playerIframeRef.current ) {
			postPreviewPlayerMessage( { event: 'videopress_action_play' } );
			markPlaying( true );
		}
	}, [ markPlaying, postPreviewPlayerMessage ] );

	useEffect( () => clearPreviewResumeTimer, [ clearPreviewResumeTimer ] );

	useEffect( () => {
		const onPreviewPlayerMessage = ( event: MessageEvent ) => {
			if ( ! isAllowedOrigin( event.origin ) || ! event.data || typeof event.data !== 'object' ) {
				return;
			}

			// Ignore messages from other VideoPress embeds on the page.
			if ( event.source !== playerIframeRef.current?.contentWindow ) {
				return;
			}

			const eventData = event.data as {
				event?: string;
				currentTime?: number;
				currentTimeMs?: number;
			};

			switch ( eventData.event ) {
				case 'videopress_timeupdate': {
					const nextTime =
						typeof eventData.currentTimeMs === 'number'
							? eventData.currentTimeMs / 1000
							: eventData.currentTime;
					if ( typeof nextTime === 'number' ) {
						updateCurrentTime( nextTime );
					}
					break;
				}
				case 'videopress_playing':
					markPlaying( true );
					break;
				case 'videopress_pause':
				case 'videopress_ended':
					markPlaying( false );
					break;
			}
		};

		window.addEventListener( 'message', onPreviewPlayerMessage );
		return () => window.removeEventListener( 'message', onPreviewPlayerMessage );
	}, [ markPlaying, updateCurrentTime ] );

	useEffect( () => {
		if ( pauseWhileTyping ) {
			return;
		}

		clearPreviewResumeTimer();
		resumePreviewPlayback();
	}, [ clearPreviewResumeTimer, pauseWhileTyping, resumePreviewPlayback ] );

	const seekTo = useCallback(
		( nextTime: number ) => {
			const safeTime = Math.max( 0, nextTime );
			if ( videoRef.current ) {
				videoRef.current.currentTime = safeTime;
			} else if ( playerIframeRef.current ) {
				postPreviewPlayerMessage( {
					event: 'videopress_action_set_currenttime',
					currentTime: safeTime,
				} );
			}
			updateCurrentTime( safeTime );
		},
		[ postPreviewPlayerMessage, updateCurrentTime ]
	);

	const seekBy = useCallback(
		( seconds: number ) => {
			const baseTime = videoRef.current?.currentTime ?? currentTimeRef.current;
			seekTo( baseTime + seconds );
		},
		[ seekTo ]
	);

	const togglePlayback = useCallback( () => {
		const video = videoRef.current;
		if ( ! video ) {
			if ( ! playerIframeRef.current ) {
				return;
			}

			postPreviewPlayerMessage( {
				event: isPreviewPlaying ? 'videopress_action_pause' : 'videopress_action_play',
			} );
			markPlaying( ! isPreviewPlaying );
			return;
		}

		if ( video.paused ) {
			video.play().catch( error => debug( 'preview keyboard play error', error ) );
			return;
		}

		video.pause();
	}, [ isPreviewPlaying, markPlaying, postPreviewPlayerMessage ] );

	/*
	 * Explicit play/pause for hosts that manage playback state themselves
	 * (the chapter editor's transport and scrub handlers), mirroring
	 * togglePlayback's per-backend branches.
	 */
	const play = useCallback( () => {
		const video = videoRef.current;
		if ( video ) {
			video.play().catch( error => debug( 'preview play error', error ) );
			return;
		}
		if ( ! playerIframeRef.current ) {
			return;
		}
		postPreviewPlayerMessage( { event: 'videopress_action_play' } );
		markPlaying( true );
	}, [ markPlaying, postPreviewPlayerMessage ] );

	const pause = useCallback( () => {
		const video = videoRef.current;
		if ( video ) {
			video.pause();
			return;
		}
		if ( ! playerIframeRef.current ) {
			return;
		}
		postPreviewPlayerMessage( { event: 'videopress_action_pause' } );
		markPlaying( false );
	}, [ markPlaying, postPreviewPlayerMessage ] );

	// The native element is the source of truth when present; the embed's
	// state is mirrored into isPreviewPlaying by the postMessage listener.
	const isPlaying = useCallback( () => {
		const video = videoRef.current;
		return video ? ! video.paused : isPreviewPlaying;
	}, [ isPreviewPlaying ] );

	const schedulePreviewResume = useCallback( () => {
		clearPreviewResumeTimer();

		previewResumeTimerRef.current = setTimeout( () => {
			previewResumeTimerRef.current = null;
			resumePreviewPlayback();
		}, PREVIEW_RESUME_DELAY_MS );
	}, [ clearPreviewResumeTimer, resumePreviewPlayback ] );

	const pauseWhileTypingNow = useCallback( () => {
		if ( ! pauseWhileTyping ) {
			return;
		}

		if ( videoRef.current && ! videoRef.current.paused ) {
			shouldResumePreviewAfterTypingRef.current = true;
			videoRef.current.pause();
		} else if ( playerIframeRef.current && isPreviewPlaying ) {
			shouldResumePreviewAfterTypingRef.current = true;
			postPreviewPlayerMessage( { event: 'videopress_action_pause' } );
			markPlaying( false );
		}

		if ( shouldResumePreviewAfterTypingRef.current ) {
			schedulePreviewResume();
		}
	}, [
		isPreviewPlaying,
		markPlaying,
		pauseWhileTyping,
		postPreviewPlayerMessage,
		schedulePreviewResume,
	] );

	useImperativeHandle(
		ref,
		() => ( {
			seekTo,
			seekBy,
			togglePlayback,
			play,
			pause,
			isPlaying,
			getCurrentTime: () => videoRef.current?.currentTime ?? currentTimeRef.current,
			pauseWhileTypingNow,
		} ),
		[ seekTo, seekBy, togglePlayback, play, pause, isPlaying, pauseWhileTypingNow ]
	);

	const nativePreviewSrc = isDirectVideoSource( videoSrc ) ? videoSrc : '';
	// Hold the embed back until the playback-token fetch for a private video settles.
	const isAwaitingPlaybackToken = !! isPrivate && playbackToken === null;
	const videoPressPreviewUrl =
		nativePreviewSrc || isAwaitingPlaybackToken
			? ''
			: getVideoPressPreviewUrl(
					guid,
					isPrivate,
					isPrivate ? playbackToken || undefined : undefined
			  );
	let previewElement: ReactElement;

	if ( nativePreviewSrc ) {
		previewElement = (
			<video
				ref={ videoRef }
				aria-label={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
				src={ nativePreviewSrc }
				poster={ poster }
				controls
				onTimeUpdate={ event => updateCurrentTime( event.currentTarget.currentTime ) }
				onPlay={ () => markPlaying( true ) }
				onPause={ () => markPlaying( false ) }
			/>
		);
	} else if ( videoPressPreviewUrl ) {
		previewElement = (
			<iframe
				ref={ playerIframeRef }
				title={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
				src={ videoPressPreviewUrl }
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
				allowFullScreen
			/>
		);
	} else {
		previewElement = (
			<div className="videopress-caption-manager__video-placeholder">
				{ __( 'Video preview unavailable.', 'jetpack-videopress-pkg' ) }
			</div>
		);
	}

	return (
		<aside className="videopress-caption-manager__preview">
			<div
				className="videopress-caption-manager__video"
				style={
					previewAspectRatio
						? ( { '--preview-ar': previewAspectRatio } as CSSProperties )
						: undefined
				}
			>
				{ previewElement }
				{ activeCueText && (
					<div className="videopress-caption-manager__caption-overlay">{ activeCueText }</div>
				) }
			</div>
			<CheckboxControl
				label={ __( 'Pause while typing', 'jetpack-videopress-pkg' ) }
				checked={ pauseWhileTyping }
				onChange={ value => setPauseWhileTyping( Boolean( value ) ) }
				__nextHasNoMarginBottom={ true }
			/>
		</aside>
	);
}

export default forwardRef( CaptionPreviewPlayer );
