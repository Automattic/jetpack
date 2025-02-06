/*
 * Helper function to get the first non-link ancestor of an element.
 * Used to determine the sentence context for a given word inside a link.
 */
export const getNonLinkAncestor = ( element: HTMLElement ) => {
	let parent: HTMLElement | null = element?.parentElement ?? null;

	while ( parent && parent.tagName === 'A' ) {
		parent = parent.parentElement;
	}

	return parent;
};
