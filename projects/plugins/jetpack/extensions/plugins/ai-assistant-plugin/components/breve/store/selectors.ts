// POPOVER

export function isHighlightHover( state ) {
	return state.popover.isHighlightHover;
}

export function isPopoverHover( state ) {
	return state.popover.isPopoverHover;
}

export function getPopoverAnchor( state ) {
	return state.popover.anchor;
}

// CONFIGURATION

export function isProofreadEnabled( state ) {
	return state.configuration.enabled;
}

export function isFeatureEnabled( state, feature ) {
	return ! state.configuration.disabled.includes( feature );
}

export function getDisabledFeatures( state ) {
	return state.configuration.disabled;
}
