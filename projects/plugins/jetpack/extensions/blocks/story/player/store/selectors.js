/**
 * Returns true if the state for this player id has been initialized
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} Player ready.
 */
export function isPlayerReady( state, playerId ) {
	return !! state[ playerId ];
}

/**
 * Returns the current slide index, starting from 0
 *
 * @param {Object} state State object.
 *
 * @return {Number} Current slide index.
 */
export function getCurrentSlideIndex( state, playerId ) {
	return state[ playerId ].currentSlide.index;
}

/**
 * Returns the current slide progress state
 *
 * @param {Object} state State object.
 *
 * @return {Number} progress object.
 */
export function getCurrentSlideProgress( state, playerId ) {
	return state[ playerId ].currentSlide.progress;
}

/**
 * Returns the current slide progress (from 0 to 100)
 *
 * @param {Object} state State object.
 *
 * @return {Number} progress percentage.
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
 * @param {Object} state State object.
 *
 * @return {Boolean} is player playing
 */
export function isPlaying( state, playerId ) {
	return state[ playerId ].playing;
}

/**
 * Returns the mute status of the story
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} is story muted.
 */
export function isMuted( state, playerId ) {
	return state[ playerId ].muted;
}

/**
 * Returns the current slide media element
 *
 * @param {Object} state State object.
 *
 * @return {Number} underlying media element for the current slide.
 */
export function getCurrentMediaElement( state, playerId ) {
	return state[ playerId ].currentSlide.mediaElement;
}

/**
 * Returns the current slide duration (only if it is an image)
 *
 * @param {Object} state State object.
 *
 * @return {Number} slide duration.
 */
export function getCurrentMediaDuration( state, playerId ) {
	return state[ playerId ].currentSlide.duration;
}

/**
 * Returns the status of the current slide playback,
 * whether it has ended playing or not.
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} has slide ended.
 */
export function hasCurrentSlideEnded( state, playerId ) {
	return state[ playerId ].currentSlide.ended;
}

/**
 * Returns the status of the current slide,
 * is the media ready to be played or not
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} is current slide ready.
 */
export function isCurrentSlideReady( state, playerId ) {
	return state[ playerId ].currentSlide.ready;
}

/**
 * Returns the previous slide media element
 *
 * @param {Object} state State object.
 *
 * @return {Number} underlying media element for the previous slide.
 */
export function getPreviousSlideMediaElement( state, playerId ) {
	return state[ playerId ].previousSlide?.mediaElement;
}

/**
 * Returns whether the player is currently displayed in
 * fullscreen mode or inlined in the page
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} is player fullscreen ended.
 */
export function isFullscreen( state, playerId ) {
	return state[ playerId ].fullscreen;
}

/**
 * Returns whether the story has ended or not
 *
 * @param {Object} state State object.
 *
 * @return {Boolean} story ended.
 */
export function hasEnded( state, playerId ) {
	return state[ playerId ].ended;
}

/**
 * Returns the current player settings
 *
 * @param {Object} state State object.
 *
 * @return {Object} player settings.
 */
export function getSettings( state, playerId ) {
	return state[ playerId ].settings;
}

/**
 * Returns the number of slides the player currently knows about
 *
 * @param {Object} state State object.
 *
 * @return {Number} how many slides the story has.
 */
export function getSlideCount( state, playerId ) {
	return state[ playerId ].settings.slideCount;
}
