/**
 * Internal dependencies
 */
import { FEATURES } from '../constants';
/**
 * Types
 */
import type { SeoEnhancerAction, SeoEnhancerState } from '../types';
function saveFeatureState( features: Record< ( typeof FEATURES )[ number ], boolean > ) {
	localStorage.setItem( 'jetpack-seo-enhancer-features', JSON.stringify( features ) );
}

export function reducer( state: SeoEnhancerState, action: SeoEnhancerAction ) {
	let newState = state;

	switch ( action.type ) {
		case 'SET_BUSY':
			return { ...state, isBusy: action.isBusy };

		case 'SET_IS_TOGGLING_AUTO_ENHANCE':
			return { ...state, isTogglingAutoEnhance: action.isToggling };

		case 'SET_IS_AUTO_ENHANCE_ENABLED':
			return { ...state, isAutoEnhanceEnabled: action.isEnabled };

		case 'SET_IMAGE_BUSY':
			return { ...state, busyImages: { ...state.busyImages, [ action.clientId ]: action.isBusy } };

		case 'SET_IMAGE_FAILED':
			return {
				...state,
				failedImages: { ...state.failedImages, [ action.clientId ]: action.failed },
			};

		case 'SET_FEATURE_ENABLED':
			newState = {
				...state,
				features: { ...state.features, [ action.feature ]: action.enabled },
			};
			saveFeatureState( newState.features );
			return newState;

		default:
			return state;
	}
}

export default reducer;
