export function isHighlightHover( state ) {
	return state.popover.isHighlightHover;
}

export function isPopoverHover( state ) {
	return state.popover.isPopoverHover;
}

export function getPopoverAnchor( state ) {
	return state.popover.anchor;
}

export function getBlocksContent( state ) {
	return state.content;
}

export function isProofreadEnabled( state ) {
	return state.configuration.enabled;
}
