/**
 * Returns an action object used in signalling that
 * the story is muted
 *
 * @param {string} playerId  - player identifier
 * @param {boolean} muted    - whether to mute or unmute the player.
 *
 * @returns {object} Action object.
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
 * @param {string} playerId  - player identifier
 * @param {boolean} playing  - whether to play or pause the story
 *
 * @returns {object} Action object.
 */
export function setPlaying( playerId, playing ) {
	return {
		type: 'SET_PLAYING',
		value: playing,
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * the current slide has changed
 *
 * @param {string} playerId   - player identifier
 * @param {number} slideIndex - index of the slide to display
 *
 * @returns {object} Action object.
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
 * @param {string} playerId          - player identifier
 * @param {HTMLElement} mediaElement - the DOM media element used for this slide
 * @param {number} duration          - the duration of the slide
 *
 * @returns {object} Action object.
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
 * @param {string} playerId      - player identifier
 * @param {object} progressState - the state tracking progress for the current slide
 *
 * @returns {object} Action object.
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
 * @param {string} playerId  - player identifier
 *
 * @returns {object} Action object.
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
 * @param {string} playerId  - player identifier
 *
 * @returns {object} Action object.
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
 * @param {string} playerId    - player identifier
 * @param {boolean} fullscreen - whether to display the story fullscreen or exit fullscreen
 *
 * @returns {object} Action object.
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
 * @param {string} playerId  - player identifier
 *
 * @returns {object} Action object.
 */
export function setEnded( playerId ) {
	return {
		type: 'ENDED',
		playerId,
	};
}

/**
 * Returns an action object used in signalling that
 * a state should created for this player id
 *
 * @param {string} playerId  - player identifier
 * @param {object} settings
 *
 * @returns {object} Action object.
 */
export function init( playerId, settings = {} ) {
	return {
		type: 'INIT',
		playerId,
		settings,
	};
}
