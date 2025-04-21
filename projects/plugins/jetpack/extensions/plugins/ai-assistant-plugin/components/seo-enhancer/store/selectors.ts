import { createSelector as wpCreateSelector } from '@wordpress/data';
/**
 * Types
 */
import type { PromptType, SeoEnhancerState } from '../types';

export function isBusy( state: SeoEnhancerState ) {
	return state.isBusy;
}

export function isTitleBusy( state: SeoEnhancerState ) {
	return state.isTitleBusy;
}

export function isDescriptionBusy( state: SeoEnhancerState ) {
	return state.isDescriptionBusy;
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

const baseGetEnabledFeatures = ( state: SeoEnhancerState ): PromptType[] => {
	return Object.keys( state.features ).filter(
		feature => state.features[ feature ]
	) as PromptType[];
};

// Check if createSelector is available
const createSelector = typeof wpCreateSelector === 'function' ? wpCreateSelector : null;

// @todo: Refactor this to only use createSelector once P2 is using a version of Gutenberg that is 18.2 or higher.
export const getEnabledFeatures = createSelector
	? createSelector( baseGetEnabledFeatures, ( state: SeoEnhancerState ) => [ state.features ] )
	: baseGetEnabledFeatures;

export function isImageAltTextFeatureEnabled( state: SeoEnhancerState ) {
	return getEnabledFeatures( state ).includes( 'images-alt-text' );
}
