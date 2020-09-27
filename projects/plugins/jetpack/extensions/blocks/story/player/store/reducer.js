const defaultSlideProgressState = {
	currentTime: 0,
	duration: null,
	timeout: null,
	lastUpdate: null,
};

const defaultCurrentSlideState = {
	progress: defaultSlideProgressState,
	index: 0,
	mediaElement: null,
	duration: null,
	ended: false,
	ready: false,
};

const defaultPlayerState = {
	currentSlide: defaultCurrentSlideState,
	previousSlide: null, // used to reset the media that was just played
	muted: false,
	playing: false,
};

export function player( state = defaultPlayerState, action ) {
	switch ( action.type ) {
		case 'SHOW_SLIDE':
			return {
				...state,
				currentSlide: {
					...defaultCurrentSlideState,
					index: action.index,
				},
				previousSlide: state.currentSlide,
			};
		case 'SLIDE_READY':
			return {
				...state,
				currentSlide: {
					...state.currentSlide,
					mediaElement: action.mediaElement,
					duration: action.duration,
					ready: true,
				},
				previousSlide: null,
			};
		case 'SET_CURRENT_SLIDE_PROGRESS':
			return {
				...state,
				currentSlide: {
					...state.currentSlide,
					progress: action.value,
				},
			};
		case 'SET_CURRENT_SLIDE_ENDED':
			return {
				...state,
				currentSlide: {
					...state.currentSlide,
					ended: true,
				},
			};
		case 'RESET_CURRENT_SLIDE_PROGRESS':
			return {
				...state,
				currentSlide: {
					...state.currentSlide,
					progress: {
						...defaultSlideProgressState,
					},
				},
			};
		case 'SET_MUTED':
			return {
				...state,
				muted: action.value,
			};
		case 'SET_PLAYING':
			return {
				...state,
				playing: action.value,
			};
	}

	return state;
}

/**
 * Reducer managing all players state
 *
 * @param {Object} state  Current state.
 * @param {Object} action Dispatched action.
 *
 * @return {Object} Updated state.
 */
export default function ( state = {}, action ) {
	if ( ! action.playerId ) {
		return state;
	}

	return {
		...state,
		[ action.playerId ]: player( state[ action.playerId ], action ),
	};
}
