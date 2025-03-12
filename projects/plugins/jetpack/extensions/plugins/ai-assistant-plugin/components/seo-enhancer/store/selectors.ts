/**
 * Types
 */
import type { SeoEnhancerState } from '../types';

export function isBusy( state: SeoEnhancerState ) {
	return state.isBusy;
}

export function isTogglingAutoEnhance( state: SeoEnhancerState ) {
	return state.isTogglingAutoEnhance;
}

export function isAutoEnhanceEnabled( state: SeoEnhancerState ) {
	return state.isAutoEnhanceEnabled;
}
