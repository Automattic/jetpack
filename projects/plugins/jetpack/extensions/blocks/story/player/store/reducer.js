/**
 * External dependencies
 */
import { merge } from 'lodash';

/**
 * Internal dependencies
 */
import {
	defaultCurrentSlideState,
	defaultSlideProgressState,
	defaultPlayerState,
} from './constants';

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
				fullscreen:
					! state.playing && action.value ? state.settings.playInFullscreen : state.fullscreen,
				ended: action.value ? false : state.ended,
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
		case 'INIT':
			const playerSettings = merge( {}, state.settings, action.settings );

			return {
				...state,
				settings: playerSettings,
				playing: playerSettings.playOnLoad,
				fullscreen: playerSettings.loadInFullscreen,
			};
		case 'ENDED':
			return {
				...state,
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
