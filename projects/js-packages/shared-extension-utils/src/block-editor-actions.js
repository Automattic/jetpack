import domReady from '@wordpress/dom-ready';

const JETPACK_EDITOR_ACTION = 'jetpack-editor-action';

/**
 * Get the Jetpack Editor action from the URL.
 *
 * @return {string | null} The Jetpack Editor action.
 */
export function getJetpackEditorAction() {
	const url = new URL( window.location.href );

	return url.searchParams.get( JETPACK_EDITOR_ACTION );
}

/**
 * Remove the Jetpack Editor action from the URL.
 *
 */
export function removeJetpackEditorAction() {
	const url = new URL( window.location.href );
	url.searchParams.delete( JETPACK_EDITOR_ACTION );
	window.history.replaceState( null, '', url.toString() );
}

/**
 * Handle a particular Jetpack Editor action.
 *
 * If the callback returns true, the Jetpack Editor action will be removed from the URL.
 *
 * @param {string}               action   - The action to handle.
 * @param {() => (void|boolean)} callback - The callback to run when the action is handled.
 */
export function handleJetpackEditorAction( action, callback ) {
	domReady( () => {
		const actionValue = getJetpackEditorAction();
		if ( action !== actionValue ) {
			return;
		}
		const removeQueryArg = callback();

		if ( removeQueryArg ) {
			removeJetpackEditorAction();
		}
	} );
}
