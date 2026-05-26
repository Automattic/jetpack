import {
	FINISH_RENDERING_MESSAGES,
	RECEIVE_RENDERED_MESSAGES,
	START_RENDERING_MESSAGES,
} from '../actions/constants';
import {
	finishRenderingMessages,
	receiveRenderedMessages,
	startRenderingMessages,
} from '../actions/rendered-messages';
import { RenderedMessages } from '../types';

type Action =
	| ReturnType< typeof startRenderingMessages >
	| ReturnType< typeof receiveRenderedMessages >
	| ReturnType< typeof finishRenderingMessages >
	| { type: 'default' };

/**
 * Rendered-messages reducer. State is keyed by `${postId}|${itemsHash}` so each
 * unique render-input batch lives in its own slot — reverting to a previously
 * seen items shape reads back the original response cleanly.
 *
 * Each entry tracks `isLoading` alongside its `items`, so consumers can read a
 * single status flag instead of stitching together resolver state.
 *
 * @param state  - Slice state.
 * @param action - Action object.
 * @return Updated slice state.
 */
export function renderedMessages( state: RenderedMessages = {}, action: Action ): RenderedMessages {
	switch ( action.type ) {
		case START_RENDERING_MESSAGES:
			return {
				...state,
				[ action.cacheKey ]: {
					...state[ action.cacheKey ],
					isLoading: true,
				},
			};
		case RECEIVE_RENDERED_MESSAGES:
			return {
				...state,
				[ action.cacheKey ]: {
					isLoading: false,
					items: action.batch,
				},
			};
		case FINISH_RENDERING_MESSAGES:
			return {
				...state,
				[ action.cacheKey ]: {
					...state[ action.cacheKey ],
					isLoading: false,
				},
			};
		default:
			return state;
	}
}
