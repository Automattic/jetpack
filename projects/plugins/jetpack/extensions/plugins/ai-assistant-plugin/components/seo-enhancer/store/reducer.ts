/**
 * Types
 */
import type { SeoEnhancerAction, SeoEnhancerState } from '../types';

export function reducer( state: SeoEnhancerState, action: SeoEnhancerAction ) {
	switch ( action.type ) {
		case 'SET_BUSY':
			return { ...state, isBusy: action.isBusy };
		default:
			return state;
	}
}

export default reducer;
