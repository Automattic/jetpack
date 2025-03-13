import { dispatch } from '@wordpress/data';
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
			/**
			 * This should have been the `store` from '@wordpress/interface',
			 * but that causes some build issues.
			 *
			 * TODO: Fix this.
			 */
			dispatch( 'core/interface' ).enableComplementaryArea( 'core', sidebarToOpen );

			onAction?.( action );

			if ( removeQueryArg ) {
				removeJetpackEditorAction();
			}
		}
	} );
}
