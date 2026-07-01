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
import { isAllowedOrigin } from '../../lib/videopress-allowed-origins';
/**
 * Types
 */
import type { CSSProperties, ForwardedRef, ReactElement } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal:preview-player' );

const PREVIEW_RESUME_DELAY_MS = 1200;
const DIRECT_VIDEO_SOURCE_REGEX = /\.(m4v|mov|mp4|ogv|webm)(?:[?#].*)?$/i;

const isDirectVideoSource = ( source?: string ) =>
	!! source && DIRECT_VIDEO_SOURCE_REGEX.test( source );

const getVideoPressPreviewUrl = ( guid: string ) =>
	addQueryArgs( `https://videopress.com/embed/${ guid }`, {
		controls: true,
		resizeToParent: true,
	} );

/**
 * Imperative controls the caption editor uses to drive the preview from its
 * keyboard shortcuts and typing handlers.
 */
export type CaptionPreviewPlayerHandle = {
	seekTo: ( seconds: number ) => void;
	seekBy: ( seconds: number ) => void;
	togglePlayback: () => void;
	getCurrentTime: () => number;
	pauseWhileTypingNow: () => void;
};

type CaptionPreviewPlayerProps = {
	guid: string;
	videoSrc?: string;
	poster?: string;
	previewAspectRatio?: string;
	activeCueText?: string;
	onCurrentTimeChange: ( seconds: number ) => void;
};

/**
 * Video preview for the caption editor.
 *
 * Plays either a direct video source (a native `<video>`) or the VideoPress
 * embed (an iframe driven over postMessage), tracks playback time so the editor
 * can highlight the active cue, and pauses playback while the author types.
 *
 * @param props                     - Component props.
 * @param props.guid                - VideoPress GUID, used for the embed player.
 * @param props.videoSrc            - Optional direct video source.
 * @param props.poster              - Optional poster image for the native player.
 * @param props.previewAspectRatio  - Aspect ratio (`W / H`) to size the frame.
 * @param props.activeCueText       - Text of the cue currently under the playhead.
 * @param props.onCurrentTimeChange - Called with the playback time in seconds.
 * @param ref                       - Imperative playback controls.
 * @return The preview panel.
 */
function CaptionPreviewPlayer(
	{
		guid,
		videoSrc,
		poster,
		previewAspectRatio,
		activeCueText,
		onCurrentTimeChange,
	}: CaptionPreviewPlayerProps,
	ref: ForwardedRef< CaptionPreviewPlayerHandle >
): ReactElement {
	const videoRef = useRef< HTMLVideoElement >( null );
	const playerIframeRef = useRef< HTMLIFrameElement >( null );
	const previewResumeTimerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const shouldResumePreviewAfterTypingRef = useRef( false );
	const currentTimeRef = useRef( 0 );
	const onCurrentTimeChangeRef = useRef( onCurrentTimeChange );
	onCurrentTimeChangeRef.current = onCurrentTimeChange;
	const [ isPreviewPlaying, setIsPreviewPlaying ] = useState( false );
	const [ pauseWhileTyping, setPauseWhileTyping ] = useState( true );

	const updateCurrentTime = useCallback( ( seconds: number ) => {
		currentTimeRef.current = seconds;
		onCurrentTimeChangeRef.current( seconds );
	}, [] );

	const clearPreviewResumeTimer = useCallback( () => {
		if ( previewResumeTimerRef.current ) {
			clearTimeout( previewResumeTimerRef.current );
			previewResumeTimerRef.current = null;
		}
	}, [] );

	const postPreviewPlayerMessage = useCallback( ( message: Record< string, unknown > ) => {
		playerIframeRef.current?.contentWindow?.postMessage( message, '*' );
	}, [] );

	useEffect( () => clearPreviewResumeTimer, [ clearPreviewResumeTimer ] );

	useEffect( () => {
		const onPreviewPlayerMessage = ( event: MessageEvent ) => {
			if ( ! isAllowedOrigin( event.origin ) || ! event.data || typeof event.data !== 'object' ) {
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
					setIsPreviewPlaying( true );
					break;
				case 'videopress_pause':
				case 'videopress_ended':
					setIsPreviewPlaying( false );
					break;
			}
		};

		window.addEventListener( 'message', onPreviewPlayerMessage );
		return () => window.removeEventListener( 'message', onPreviewPlayerMessage );
	}, [ updateCurrentTime ] );

	useEffect( () => {
		if ( pauseWhileTyping ) {
			return;
		}

		clearPreviewResumeTimer();
		if ( shouldResumePreviewAfterTypingRef.current && videoRef.current?.paused ) {
			videoRef.current.play().catch( error => debug( 'resume preview after typing error', error ) );
		} else if ( shouldResumePreviewAfterTypingRef.current && playerIframeRef.current ) {
			postPreviewPlayerMessage( { event: 'videopress_action_play' } );
			setIsPreviewPlaying( true );
		}
		shouldResumePreviewAfterTypingRef.current = false;
	}, [ clearPreviewResumeTimer, pauseWhileTyping, postPreviewPlayerMessage ] );

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
			setIsPreviewPlaying( ! isPreviewPlaying );
			return;
		}

		if ( video.paused ) {
			video.play().catch( error => debug( 'preview keyboard play error', error ) );
			return;
		}

		video.pause();
	}, [ isPreviewPlaying, postPreviewPlayerMessage ] );

	const schedulePreviewResume = useCallback( () => {
		clearPreviewResumeTimer();

		previewResumeTimerRef.current = setTimeout( () => {
			previewResumeTimerRef.current = null;

			if ( ! shouldResumePreviewAfterTypingRef.current ) {
				return;
			}

			shouldResumePreviewAfterTypingRef.current = false;
			const video = videoRef.current;
			if ( video?.paused ) {
				video.play().catch( error => debug( 'resume preview after typing error', error ) );
			} else if ( playerIframeRef.current ) {
				postPreviewPlayerMessage( { event: 'videopress_action_play' } );
				setIsPreviewPlaying( true );
			}
		}, PREVIEW_RESUME_DELAY_MS );
	}, [ clearPreviewResumeTimer, postPreviewPlayerMessage ] );

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
			setIsPreviewPlaying( false );
		}

		if ( shouldResumePreviewAfterTypingRef.current ) {
			schedulePreviewResume();
		}
	}, [ isPreviewPlaying, pauseWhileTyping, postPreviewPlayerMessage, schedulePreviewResume ] );

	useImperativeHandle(
		ref,
		() => ( {
			seekTo,
			seekBy,
			togglePlayback,
			getCurrentTime: () => videoRef.current?.currentTime ?? currentTimeRef.current,
			pauseWhileTypingNow,
		} ),
		[ seekTo, seekBy, togglePlayback, pauseWhileTypingNow ]
	);

	const nativePreviewSrc = isDirectVideoSource( videoSrc ) ? videoSrc : '';
	const videoPressPreviewUrl = nativePreviewSrc ? '' : getVideoPressPreviewUrl( guid );
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
				onPlay={ () => setIsPreviewPlaying( true ) }
				onPause={ () => setIsPreviewPlaying( false ) }
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
