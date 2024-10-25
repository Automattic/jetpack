/**
 * Types
 */
import type { Anchor, BreveState } from '../types';

// Popover

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

// Configuration

export function isProofreadEnabled( state: BreveState ) {
	return state.configuration?.enabled;
}

export function isFeatureEnabled( state: BreveState, feature: string ) {
	return ! state.configuration?.disabled?.includes( feature );
}

export function isFeatureDictionaryLoading( state: BreveState, feature: string ) {
	return state.configuration?.loading?.includes( feature );
}

export function getDisabledFeatures( state: BreveState ) {
	return state.configuration?.disabled;
}

export function getReloadFlag( state: BreveState ) {
	return state.configuration?.reload;
}

// Suggestions

export function getBlockMd5( state: BreveState, blockId: string ) {
	return state.suggestions?.[ blockId ]?.md5 ?? '';
}

export function getSuggestionsLoading(
	state: BreveState,
	{ feature, id, blockId }: { feature: string; id: string; blockId: string }
) {
	return state.suggestions?.[ blockId ]?.[ feature ]?.[ id ]?.loading;
}

export function getSuggestions(
	state: BreveState,
	{ feature, id, blockId }: { feature: string; id: string; blockId: string }
) {
	return state.suggestions?.[ blockId ]?.[ feature ]?.[ id ]?.suggestions;
}

export function getIgnoredSuggestions( state: BreveState, { blockId }: { blockId: string } ) {
	return state.suggestions?.[ blockId ]?.ignored;
}
