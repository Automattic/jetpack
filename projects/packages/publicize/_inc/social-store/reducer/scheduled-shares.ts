import { SET_IS_SCHEDULING_SHARES } from '../actions/constants';
import { setIsSchedulingShares } from '../actions/scheduled-shares';
import { SocialStoreState } from '../types';

type Action = ReturnType< typeof setIsSchedulingShares > | { type: 'default' };

/**
 * Scheduled shares reducer
 *
 * @param state  - State object.
 * @param action - Action object.
 *
 * @return - The updated state.
 */
export function scheduledShares(
	state: SocialStoreState[ 'scheduledShares' ] = {},
	action: Action
): SocialStoreState[ 'scheduledShares' ] {
	switch ( action.type ) {
		case SET_IS_SCHEDULING_SHARES:
			return {
				...state,
				isScheduling: action.isScheduling,
			};
	}

	return state;
}
