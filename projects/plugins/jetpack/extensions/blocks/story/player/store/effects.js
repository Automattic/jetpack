/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { setCurrentSlideProgress, setCurrentSlideEnded } from './actions';
import {
	getCurrentSlideProgress,
	isMuted,
	isPlaying,
	isCurrentSlideReady,
	hasCurrentSlideEnded,
	getCurrentMediaElement,
	getCurrentMediaDuration,
} from './selectors';

const isVideo = mediaElement =>
	mediaElement && mediaElement.src && mediaElement.tagName.toLowerCase() === 'video';

function syncWithMediaElement( action, store ) {
	const { getState } = store;
	const playerId = action.playerId;

	const muted = isMuted( getState(), playerId );
	const playing = isPlaying( getState(), playerId );
	const ended = hasCurrentSlideEnded( getState(), playerId );
	const mediaElement = getCurrentMediaElement( getState(), playerId );

	if ( ! isVideo( mediaElement ) ) {
		return;
	}

	if ( muted ) {
		mediaElement.muted = muted;
		if ( ! muted ) {
			mediaElement.volume = 0.5; //settings.volume;
		}
	}

	if ( playing ) {
		mediaElement.play();
	} else {
		mediaElement.pause();
	}

	if ( ended ) {
		mediaElement.currentTime = 0;
		mediaElement.pause();
	}
}

/**
 * Effect handler which will refresh .
 *
 * @param {Object} action Action which had initiated the effect handler.
 * @param {Object} store  Store instance.
 *
 * @return {Object} Refresh connection test results action.
 */
export function trackProgress( action, store ) {
	const { getState, dispatch } = store;

	const playerId = action.playerId;
	const ready = isCurrentSlideReady( getState(), playerId );
	const playing = isPlaying( getState(), playerId );
	const currentSlideProgress = getCurrentSlideProgress( getState(), playerId );
	clearTimeout( currentSlideProgress.timeout );
	syncWithMediaElement( action, store );

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

	const delta = currentSlideProgress.lastUpdate
		? Date.now() - currentSlideProgress.lastUpdate
		: 100;
	const currentTime = isVideo( mediaElement )
		? mediaElement.currentTime
		: currentSlideProgress.currentTime + delta;

	if ( currentTime >= duration ) {
		dispatch( setCurrentSlideEnded( playerId ) );
		return;
	}

	dispatch(
		setCurrentSlideProgress( playerId, {
			timeout: setTimeout( () => trackProgress( action, store ), delta ),
			lastUpdate: Date.now(),
			duration,
			currentTime,
		} )
	);
}

export default {
	SET_PLAYING: [ trackProgress, syncWithMediaElement ],
	SLIDE_READY: [ trackProgress, syncWithMediaElement ],
	SET_MUTED: syncWithMediaElement,
	END_CURRENT_SLIDE: syncWithMediaElement,
};
