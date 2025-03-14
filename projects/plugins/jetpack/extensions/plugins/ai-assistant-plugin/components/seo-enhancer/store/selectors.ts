/**
 * Types
 */
import type { PromptType, SeoEnhancerState } from '../types';

export function isBusy( state: SeoEnhancerState ) {
	return state.isBusy;
}

export function isTogglingAutoEnhance( state: SeoEnhancerState ) {
	return state.isTogglingAutoEnhance;
}

export function isAutoEnhanceEnabled( state: SeoEnhancerState ) {
	return state.isAutoEnhanceEnabled;
}

export function isImageBusy( state: SeoEnhancerState, clientId: string ) {
	return state.busyImages[ clientId ] ?? false;
}

export function isAnyImageBusy( state: SeoEnhancerState ) {
	return Object.values( state.busyImages ).some( busy => busy );
}

export function hasImageFailed( state: SeoEnhancerState, clientId: string ) {
	return state.failedImages[ clientId ] ?? false;
}

export function getEnabledFeatures( state: SeoEnhancerState ) {
	return Object.keys( state.features ).filter(
		feature => state.features[ feature ]
	) as PromptType[];
}
