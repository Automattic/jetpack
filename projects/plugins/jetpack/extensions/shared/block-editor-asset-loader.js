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
 * Returns whether a given element is contained within an Editor iframe.
 * See: https://github.com/WordPress/gutenberg/blob/bee52e68292357011a799f067ad47aa1c1d710e1/packages/block-editor/src/components/iframe/index.js
 *
 * @param   {HTMLElement} elementRef - The element whose context we want to return.
 * @returns {boolean}                - Whether `elementRef` is contained within an Editor iframe.
 */
export function isElementInEditorIframe( elementRef ) {
	const { currentWindow } = getLoadContext( elementRef );
	return currentWindow.name === 'editor-canvas' && currentWindow.self !== currentWindow.top;
}

/**
 * Returns whether a iframe has domain access to its parent.
 *
 * @param   {HTMLElement} currentWindow - The window context for which we want to test access.
 * @returns {boolean}                   - Whether we have access to the parent window.
 */
function canIframeAccessParentWindow( currentWindow ) {
	try {
		return !! currentWindow?.parent?.location.href;
	} catch ( e ) {
		return false;
	}
}

/**
 * This function will check if the current element (e.g., a block) sits inside an Iframe (e.g., the Site Editor)
 * and tries to move elements from the parent window to the iframe.
 *
 * It's a temporary work-around to inject the styles we need for the media player into the site editor.
 * For use until Gutenberg offers a standardized way of including enqueued/3rd-party assets.
 * Target usage is the Podcast Playerblock: projects/plugins/jetpack/extensions/blocks/podcast-player/.
 *
 * @param   {Array}       elementSelectors   - An array of selectors, e.g., [ '#conan', '#robocop' ]
 * @param   {HTMLElement} elementRef         - The current element.
 * @param   {boolean}     shouldRemoveSource - Optional. Whether to remove the source element in the parent frame.
 * @returns {Array}                          - An array of successfully migrated selectors;
 */
export function maybeCopyElementsToSiteEditorContext(
	elementSelectors,
	elementRef,
	shouldRemoveSource = false
) {
	let results = [];
	// Check to see if we're in an iframe, e.g., the Site Editor.
	// If not, do nothing.
	if (
		! elementRef ||
		( ! elementSelectors && ! elementSelectors.length ) ||
		! isElementInEditorIframe( elementRef )
	) {
		return results;
	}

	const { currentDoc, currentWindow } = getLoadContext( elementRef );

	if ( ! canIframeAccessParentWindow( currentWindow ) ) {
		return results;
	}

	const parentDoc = currentWindow?.parent?.document;

	if ( currentDoc && parentDoc ) {
		results = elementSelectors.filter( selector => {
			const parentElementToCopy = parentDoc.querySelector( selector );
			const isElementAlreadyPresentInCurrentWindow = !! currentDoc.querySelector( selector );
			if ( parentElementToCopy && ! isElementAlreadyPresentInCurrentWindow ) {
				currentDoc.head.appendChild( parentElementToCopy.cloneNode() );
				if ( shouldRemoveSource ) {
					parentElementToCopy.remove();
				}
				return true;
			}
			return false;
		} );

		return results;
	}
}

/**
 * This function will check if the given css and js resources are present in the head of the document
 * for current block, and if not will load those resources into the head.
 *
 * It's a temporary work-around to until core gutenberg has an API to allow loading of 3rd party resources
 * into the current editor iframe.
 *
 * @param   {Array}       resources - An array of css and js resources to copy to iframe head.
 * @param   {Object}      callbacks - A map of any callbacks for js resources to be called when script loaded.
 * @param   {HTMLElement} elementRef  - A reference for an element within the current block.
 */
export function loadBlockEditorAssets( resources, callbacks, elementRef ) {
	const resourcePath = `${ window.Jetpack_Block_Assets_Base_Url.url }editor-assets`;
	const { currentDoc } = getLoadContext( elementRef );

	const currentHead = currentDoc.getElementsByTagName( 'head' )[ 0 ];

	resources.forEach( resource => {
		const [ filename, fileExtension ] = resource.file.split( '/' ).pop().split( '.' );

		if ( fileExtension === 'css' ) {
			if ( currentDoc.getElementById( resource.id ) ) {
				return;
			}
			const cssLink = currentDoc.createElement( 'link' );
			cssLink.id = resource.id;
			cssLink.rel = 'stylesheet';
			cssLink.href = `${ resourcePath }/${ filename }-${ resource.version }.${ fileExtension }`;
			currentHead.appendChild( cssLink );
		}

		if ( fileExtension === 'js' ) {
			const callback = callbacks[ resource.id ] ? callbacks[ resource.id ] : null;
			if ( currentDoc.getElementById( resource.id ) ) {
				return callback();
			}
			const jsScript = currentDoc.createElement( 'script' );
			jsScript.id = resource.id;
			jsScript.type = 'text/javascript';
			jsScript.src = `${ resourcePath }/${ filename }-${ resource.version }.${ fileExtension }`;
			jsScript.onload = callback;
			currentHead.appendChild( jsScript );
		}
	} );
}

/**
 * Returns a promise that resolves when a specified object becomes available on specified window.
 *
 * @param   {HTMLElement} currentWindow - The window on which to check for the object.
 * @param   {Object} objectName         - The object to check for.
 * @returns {Promise}                   - Whether `elementRef` is contained within an Editor iframe.
 */
export function waitForObject( currentWindow, objectName ) {
	return new Promise( resolve => {
		const waitFor = () => {
			if ( currentWindow[ objectName ] ) {
				resolve( currentWindow[ objectName ] );
			} else {
				currentWindow.requestAnimationFrame( waitFor );
			}
		};
		waitFor();
	} );
}
