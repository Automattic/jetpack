/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { end, setCurrentSlideProgress, setCurrentSlideEnded } from './actions';
import {
	getCurrentSlideIndex,
	getCurrentSlideProgress,
	isMuted,
	isPlaying,
	isCurrentSlideReady,
	getCurrentMediaElement,
	getCurrentMediaDuration,
	getPreviousSlideMediaElement,
	getSlideCount,
} from './selectors';

const isVideo = mediaElement =>
	mediaElement && mediaElement.src && mediaElement.tagName.toLowerCase() === 'video';

function syncWithMediaElement( action, store ) {
	const { getState } = store;
	const playerId = action.playerId;

	const muted = isMuted( getState(), playerId );
	const playing = isPlaying( getState(), playerId );
	const mediaElement = getCurrentMediaElement( getState(), playerId );
	const previousMediaElement = getPreviousSlideMediaElement( getState(), playerId );

	if ( action.type === 'SHOW_SLIDE' && isVideo( previousMediaElement ) ) {
		previousMediaElement.currentTime = 0;
		previousMediaElement.pause();
	}

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
			dispatch( end( playerId ) );
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
	SLIDE_READY: [ trackProgress, syncWithMediaElement ],
	SET_MUTED: syncWithMediaElement,
	SHOW_SLIDE: syncWithMediaElement,
};
