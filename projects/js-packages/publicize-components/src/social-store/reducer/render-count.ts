import { INCREMENT_RENDER_COUNT } from '../actions/constants';
import { incrementRenderCountFor } from '../actions/render-count';
import { SocialStoreState } from '../types';

type Action = ReturnType< typeof incrementRenderCountFor > | { type: 'default' };

/**
 * Render count reducer
 *
 * @param {SocialStoreState['renderCount']} state  - State object.
 * @param {Action}                          action - Action object.
 *
 * @return The updated state.
 */
export function renderCount(
	state: SocialStoreState[ 'renderCount' ] = {},
	action: Action
): SocialStoreState[ 'renderCount' ] {
	switch ( action.type ) {
		case INCREMENT_RENDER_COUNT:
			return {
				...state,
				[ action.key ]: ( state[ action.key ] ?? 0 ) + 1,
			};

		default:
			return state;
	}
}
