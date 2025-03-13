import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { store as interfaceStore } from '@wordpress/interface';

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
 * Handle the Jetpack Editor action.
 *
 * @param {{sidebarToOpen?: string; onAction?: (action:string) => void; removeQueryArg?: boolean}} args - Arguments.
 */
export function handleJetpackEditorAction( {
	sidebarToOpen = 'jetpack-sidebar/jetpack',
	removeQueryArg = true,
	onAction,
} ) {
	domReady( () => {
		const action = getJetpackEditorAction();
		if ( action ) {
			dispatch( interfaceStore ).enableComplementaryArea( 'core', sidebarToOpen );

			onAction?.( action );

			if ( removeQueryArg ) {
				removeJetpackEditorAction();
			}
		}
	} );
}
