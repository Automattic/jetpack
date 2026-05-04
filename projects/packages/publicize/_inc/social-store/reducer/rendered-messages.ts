import { RECEIVE_RENDERED_MESSAGES } from '../actions/constants';
import { receiveRenderedMessages } from '../actions/rendered-messages';
import { RenderedMessages } from '../types';

type Action = ReturnType< typeof receiveRenderedMessages > | { type: 'default' };

/**
 * Rendered-messages reducer. State is keyed by `${postId}|${itemsHash}` so each
 * unique render-input batch lives in its own slot — reverting to a previously
 * seen items shape reads back the original response cleanly.
 *
 * @param state  - Slice state.
 * @param action - Action object.
 * @return Updated slice state.
 */
export function renderedMessages( state: RenderedMessages = {}, action: Action ): RenderedMessages {
	switch ( action.type ) {
		case RECEIVE_RENDERED_MESSAGES:
			return {
				...state,
				[ action.cacheKey ]: action.batch,
			};
		default:
			return state;
	}
}
