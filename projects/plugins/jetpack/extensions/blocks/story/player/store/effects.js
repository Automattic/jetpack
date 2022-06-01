import { setBuffering, setCurrentSlideEnded, setCurrentSlideProgress, setEnded } from './actions';
import {
	getCurrentSlideIndex,
	getCurrentSlideProgress,
	isMuted,
	isPlaying,
	isCurrentSlideReady,
	getCurrentMediaElement,
	getCurrentMediaDuration,
	getPreviousSlideMediaElement,
	getSettings,
	getSlideCount,
} from './selectors';

const isVideo = mediaElement =>
	mediaElement && mediaElement.src && mediaElement.tagName.toLowerCase() === 'video';

/**
 * Effect handler which will sync a new media element with the current
 * slide progress state. This is useful in particular when player is
 * re-mounted somewhere else.
 *
 * @param {Object} action  - Action which had initiated the effect handler.
 * @param {Object} store   - Store instance.
 */
function syncNewMediaElement( action, store ) {
	const { getState, dispatch } = store;
	const playerId = action.playerId;

	const mediaElement = getCurrentMediaElement( getState(), playerId );

	if ( ! isVideo( mediaElement ) ) {
		return;
	}

	const currentSlideProgress = getCurrentSlideProgress( getState(), playerId );

	if ( mediaElement.currentTime === 0 && currentSlideProgress.currentTime > 0 ) {
		mediaElement.currentTime = currentSlideProgress.currentTime;
	}

	mediaElement.onwaiting = () => dispatch( setBuffering( playerId, true ) );
	mediaElement.onplaying = () => dispatch( setBuffering( playerId, false ) );
}

/**
 * Effect handler which will sync the current slide progress with a video element
 *
 * @param {Object} action  - Action which had initiated the effect handler.
 * @param {Object} store   - Store instance.
 */
function syncWithMediaElement( action, store ) {
	const { getState } = store;
	const playerId = action.playerId;

	const muted = isMuted( getState(), playerId );
	const playing = isPlaying( getState(), playerId );
	const mediaElement = getCurrentMediaElement( getState(), playerId );
	const previousMediaElement = getPreviousSlideMediaElement( getState(), playerId );
	const settings = getSettings( getState(), playerId );

	if ( isVideo( previousMediaElement ) ) {
		previousMediaElement.currentTime = 0;
		previousMediaElement.onwaiting = null;
		previousMediaElement.onplaying = null;
		previousMediaElement.pause();
	}

	if ( ! isVideo( mediaElement ) ) {
		return;
	}

	if ( muted !== mediaElement.muted ) {
		mediaElement.muted = muted;
		if ( ! muted ) {
			mediaElement.volume = settings.volume;
		}
	}

	if ( playing ) {
		mediaElement.play();
	} else {
		mediaElement.pause();
	}
}

/**
 * Effect handler which will track the current slide progress.
 *
 * @param {Object} action  - Action which had initiated the effect handler.
 * @param {Object} store   - Store instance.
 */
export function trackProgress( action, store ) {
	const { getState, dispatch } = store;

	const playerId = action.playerId;
	const ready = isCurrentSlideReady( getState(), playerId );
	const playing = isPlaying( getState(), playerId );
	const currentSlideProgress = getCurrentSlideProgress( getState(), playerId );
	clearTimeout( currentSlideProgress.timeout );

	if ( ! playing || ! ready ) {
		// reset lastUpdate on pause
		if ( currentSlideProgress.lastUpdate ) {
			dispatch(
				setCurrentSlideProgress( playerId, {
					...currentSlideProgress,
					lastUpdate: null,
				} )
			);
		}
		return;
	}

	const mediaElement = getCurrentMediaElement( getState(), playerId );
	const duration = getCurrentMediaDuration( getState(), playerId );

	const renderIntervalMs = 100;
	const deltaMs = currentSlideProgress.lastUpdate
		? Date.now() - currentSlideProgress.lastUpdate
		: renderIntervalMs;
	const currentTime = isVideo( mediaElement )
		? mediaElement.currentTime
		: currentSlideProgress.currentTime + deltaMs / 1000;

	if ( currentTime >= duration ) {
		dispatch( setCurrentSlideEnded( playerId ) );

		const slideCount = getSlideCount( getState(), playerId );
		const currentSlideIndex = getCurrentSlideIndex( getState(), playerId );
		if ( currentSlideIndex === slideCount - 1 ) {
			dispatch( setEnded( playerId ) );
		}
		return;
	}

	dispatch(
		setCurrentSlideProgress( playerId, {
			timeout: setTimeout( () => trackProgress( action, store ), renderIntervalMs ),
			lastUpdate: Date.now(),
			duration,
			currentTime,
		} )
	);
}

export default {
	SET_PLAYING: [ trackProgress, syncWithMediaElement ],
	SLIDE_READY: [ syncNewMediaElement, trackProgress, syncWithMediaElement ],
	SET_MUTED: syncWithMediaElement,
	SHOW_SLIDE: syncWithMediaElement,
};
