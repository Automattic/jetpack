/**
 * Types
 */
import type { SeoEnhancerAction, SeoEnhancerState } from '../types';

export function reducer( state: SeoEnhancerState, action: SeoEnhancerAction ) {
	switch ( action.type ) {
		case 'SET_BUSY':
			return { ...state, isBusy: action.isBusy };
		case 'SET_IS_TOGGLING_AUTO_ENHANCE':
			return { ...state, isTogglingAutoEnhance: action.isToggling };
		case 'SET_IS_AUTO_ENHANCE_ENABLED':
			return { ...state, isAutoEnhanceEnabled: action.isEnabled };
		case 'SET_IMAGE_BUSY':
			return { ...state, busyImages: { ...state.busyImages, [ action.clientId ]: action.isBusy } };
		default:
			return state;
	}
}

export default reducer;
