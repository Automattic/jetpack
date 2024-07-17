/**
 * Types
 */
import type { Anchor, BreveState } from '../types';

// POPOVER

export function isHighlightHover( state: BreveState ) {
	return state.popover?.isHighlightHover;
}

export function isPopoverHover( state: BreveState ) {
	return state.popover?.isPopoverHover;
}

export function getPopoverAnchor( state: BreveState ): Anchor | null {
	return state?.popover?.anchor ?? null;
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
