import { merge } from 'lodash';
import {
	defaultCurrentSlideState,
	defaultSlideProgressState,
	defaultPlayerState,
} from './constants';

export function player( state = defaultPlayerState, action ) {
	switch ( action.type ) {
		case 'SHOW_SLIDE': {
			const isNextSlide = state.currentSlide === action.index + 1;
			return {
				...state,
				currentSlide: {
					...defaultCurrentSlideState,
					index: action.index,
				},
				previousSlide: state.currentSlide,
				playing: isNextSlide ? state.settings.playOnNextSlide : state.playing,
			};
		}
		case 'SLIDE_READY':
			return {
				...state,
				buffering: false,
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
		case 'SET_PLAYING': {
			const resetStory = action.value && state.ended;

			return {
				...state,
				playing: action.value,
				buffering: ! action.value ? false : state.buffering,
				fullscreen:
					! state.playing && action.value ? state.settings.playInFullscreen : state.fullscreen,
				ended: resetStory ? false : state.ended,
				currentSlide: resetStory
					? {
							...defaultCurrentSlideState,
							index: 0,
					  }
					: state.currentSlide,
				previousSlide: resetStory ? null : state.previousSlide,
			};
		}
		case 'SET_BUFFERING':
			return {
				...state,
				buffering: action.value,
			};
		case 'SET_FULLSCREEN':
			return {
				...state,
				fullscreen: action.fullscreen,
				playing:
					state.fullscreen && ! action.fullscreen && state.settings.playInFullscreen
						? false
						: state.playing,
			};
		case 'INIT': {
			const playerSettings = merge( {}, state.settings, action.settings );

			return {
				...state,
				settings: playerSettings,
				playing: playerSettings.playOnLoad,
				fullscreen: playerSettings.loadInFullscreen,
			};
		}
		case 'ENDED':
			return {
				...state,
				currentSlide: {
					...defaultCurrentSlideState,
					index: state.settings.slideCount - 1,
					progress: {
						...defaultSlideProgressState,
						currentTime: 100,
						duration: 100,
					},
				},
				ended: true,
				playing: false,
				fullscreen: ! state.settings.exitFullscreenOnEnd,
			};
	}

	return state;
}

/**
 * Reducer managing all players state
 *
 * @param {Object} state  - Current state.
 * @param {Object} action - Dispatched action.
 * @returns {Object} Updated state.
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
