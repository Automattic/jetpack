/**
 * Returns the current document and window contexts for `elementRef`.
 * Use to retrieve the correct context for elements that may be within an iframe.
 *
 * @param   {HTMLElement} elementRef - The element whose context we want to return.
 * @returns {Object}                 - The current document (`currentDoc`) and window (`currentWindow`) contexts.
 */
export function getLoadContext( elementRef ) {
	const currentDoc = elementRef.ownerDocument;
	const currentWindow = currentDoc.defaultView || currentDoc.parentWindow;

	return { currentDoc, currentWindow };
}

/**
 * Returns whether a given element is contained within an iframe.
 * Useful to check if a block sits inside the Site Editor.
 *
 * @param   {HTMLElement} elementRef - The element whose context we want to return.
 * @returns {boolean}                - Whether `elementRef` is contained within an iframe.
 */
export function isElementInIframe( elementRef ) {
	const { currentWindow } = getLoadContext( elementRef );
	return currentWindow.self !== currentWindow.top;
}

/**
 * This function will check if the current element (e.g., a block) sits inside an Iframe (e.g., the Site Editor)
 * and tries to move elements from the parent window to the iframe.
 *
 * It's a temporary work-around to inject the styles we need for the media player into the site editor.
 * For use until Gutenberg offers a standardized way of including enqueued/3rd-party assets.
 * Target usage is the Podcast Playerblock: projects/plugins/jetpack/extensions/blocks/podcast-player/.
 *
 * @param   {Array}       elementSelectors - An array of selectors, e.g., [ '#conan', '#robocop' ]
 * @param   {HTMLElement} elementRef       - The current element.
 * @returns {Array}                        - An array of successfully migrated selectors;
 */
export function maybeCopyElementsToSiteEditorContext( elementSelectors = [], elementRef ) {
	// Check to see if we're in an iframe, e.g., the Site Editor.
	// If not, do nothing.
	if ( ! elementRef || ! elementSelectors.length || ! isElementInIframe( elementRef ) ) {
		return;
	}

	const { currentDoc, currentWindow } = getLoadContext( elementRef );
	const parentDoc = currentWindow?.parent?.document;
	let results = [];

	if ( currentDoc && parentDoc ) {
		results = elementSelectors.filter( selector => {
			const parentElementToCopy = parentDoc.querySelector( selector );
			const isElementAlreadyPresentInCurrentWindow = !! currentDoc.querySelector( selector );
			if ( parentElementToCopy && ! isElementAlreadyPresentInCurrentWindow ) {
				currentDoc.head.appendChild( parentElementToCopy.cloneNode() );
				parentElementToCopy.remove();
				return true;
			}
			return false;
		} );

		return results;
	}
}
