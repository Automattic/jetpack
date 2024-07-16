/**
 * Types
 */
import type { BreveState } from '../types';

// POPOVER

export function isHighlightHover( state: BreveState ) {
	return state.popover?.isHighlightHover;
}

export function isPopoverHover( state: BreveState ) {
	return state.popover?.isPopoverHover;
}

export function getPopoverAnchor( state: BreveState ): HTMLElement | EventTarget | null {
	if ( state.popover?.frozenAnchor ) {
		return state.popover.frozenAnchor;
	}

	// Returns the last non-nullish anchor in the array
	return (
		( state.popover?.anchors ?? [] ) as Array< HTMLElement | EventTarget | null >
	 ).reduceRight( ( acc, anchor ) => acc ?? anchor, null );
}

export function getPopoverLevel( state: BreveState ) {
	return state.popover?.level;
}

// CONFIGURATION

export function isProofreadEnabled( state: BreveState ) {
	return state.configuration?.enabled;
}

export function isFeatureEnabled( state: BreveState, feature: string ) {
	return ! state.configuration?.disabled?.includes( feature );
}

export function getDisabledFeatures( state: BreveState ) {
	return state.configuration?.disabled;
}
