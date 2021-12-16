/**
 * Returns true if the state for this player id has been initialized
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} Player ready.
 */
export function isPlayerReady( state, playerId ) {
	return !! state[ playerId ];
}

/**
 * Returns the current slide index, starting from 0
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} Current slide index.
 */
export function getCurrentSlideIndex( state, playerId ) {
	return state[ playerId ].currentSlide.index;
}

/**
 * Returns the current slide progress state
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} progress object.
 */
export function getCurrentSlideProgress( state, playerId ) {
	return state[ playerId ].currentSlide.progress;
}

/**
 * Returns the current slide progress (from 0 to 100)
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} progress percentage.
 */
export function getCurrentSlideProgressPercentage( state, playerId ) {
	const currentTime = state[ playerId ].currentSlide.progress.currentTime;
	const duration = state[ playerId ].currentSlide.progress.duration;
	const percentage = Math.round( ( 100 * currentTime ) / duration );
	return percentage >= 100 ? 100 : percentage;
}

/**
 * Returns the status of the player,
 * whether it's playing the story or not.
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} is player playing
 */
export function isPlaying( state, playerId ) {
	return state[ playerId ].playing;
}

/**
 * Returns the mute status of the story
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} is story muted.
 */
export function isMuted( state, playerId ) {
	return state[ playerId ].muted;
}

/**
 * Returns the status of the player,
 * whether it's waiting to load the next frame or not
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} is player buffering
 */
export function isBuffering( state, playerId ) {
	return state[ playerId ].buffering;
}

/**
 * Returns the current slide media element
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} underlying media element for the current slide.
 */
export function getCurrentMediaElement( state, playerId ) {
	return state[ playerId ].currentSlide.mediaElement;
}

/**
 * Returns the current slide duration (only if it is an image)
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} slide duration.
 */
export function getCurrentMediaDuration( state, playerId ) {
	return state[ playerId ].currentSlide.duration;
}

/**
 * Returns the status of the current slide playback,
 * whether it has ended playing or not.
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} has slide ended.
 */
export function hasCurrentSlideEnded( state, playerId ) {
	return state[ playerId ].currentSlide.ended;
}

/**
 * Returns the status of the current slide,
 * is the media ready to be played or not
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} is current slide ready.
 */
export function isCurrentSlideReady( state, playerId ) {
	return state[ playerId ].currentSlide.ready;
}

/**
 * Returns the previous slide media element
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} underlying media element for the previous slide.
 */
export function getPreviousSlideMediaElement( state, playerId ) {
	return state[ playerId ].previousSlide?.mediaElement;
}

/**
 * Returns whether the player is currently displayed in
 * fullscreen mode or inlined in the page
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} is player fullscreen.
 */
export function isFullscreen( state, playerId ) {
	return state[ playerId ].fullscreen;
}

/**
 * Returns whether the story has ended or not
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {boolean} story ended.
 */
export function hasEnded( state, playerId ) {
	return state[ playerId ].ended;
}

/**
 * Returns the current player settings
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {object} player settings.
 */
export function getSettings( state, playerId ) {
	return state[ playerId ].settings;
}

/**
 * Returns the number of slides the player currently knows about
 *
 * @param {object} state    - State object.
 * @param {string} playerId - The player identifier.
 * @returns {number} how many slides the story has.
 */
export function getSlideCount( state, playerId ) {
	return state[ playerId ].settings.slideCount;
}
