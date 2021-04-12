/**
 * Returns an action object used in signalling that
 * the story is muted
 *
 * @param {Boolean} muted whether to mute or unmute the player.
 *
 * @return {Object} Action object.
 */
export function setMuted( playerId, muted ) {
	return {
		type: 'SET_MUTED',
		value: muted,
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the story is playing
 *
 * @param {Boolean} playing whether to play or pause the story
 *
 * @return {Object} Action object.
 */
export function setPlaying( playerId, playing, mediaElement, duration ) {
	return {
		type: 'SET_PLAYING',
		value: playing,
		playerId,
		mediaElement,
		duration,
	};
}

/**
 * Returns an action object used in signalling that
 * the current slide has changed
 *
 * @return {Object} Action object.
 */
export function showSlide( playerId, slideIndex ) {
	return {
		type: 'SHOW_SLIDE',
		index: slideIndex,
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the current slide is ready to be played
 *
 * @return {Object} Action object.
 */
export function slideReady( playerId, mediaElement, duration ) {
	return {
		type: 'SLIDE_READY',
		mediaElement,
		duration,
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the progress for the current slide has been updated
 *
 * @return {Object} Action object.
 */
export function setCurrentSlideProgress( playerId, progressState ) {
	return {
		type: 'SET_CURRENT_SLIDE_PROGRESS',
		value: progressState,
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the progress for the current slide must be reset
 *
 * @return {Object} Action object.
 */
export function resetCurrentSlideProgress( playerId ) {
	return {
		type: 'RESET_CURRENT_SLIDE_PROGRESS',
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the current slide has ended
 *
 * @return {Object} Action object.
 */
export function setCurrentSlideEnded( playerId ) {
	return {
		type: 'SET_CURRENT_SLIDE_ENDED',
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the player should go into or out of fullscreen mode
 *
 * @return {Object} Action object.
 */
export function setFullscreen( playerId, fullscreen ) {
	return {
		type: 'SET_FULLSCREEN',
		playerId,
		fullscreen,
	};
}

/**
 * Returns an action object used in signalling that
 * a state should created for this player id
 *
 * @return {Object} Action object.
 */
export function end( playerId ) {
	return {
		type: 'ENDED',
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * a state should created for this player id
 *
 * @return {Object} Action object.
 */
export function init( playerId, settings = {} ) {
	return {
		type: 'INIT',
		playerId,
		settings,
	};
}
