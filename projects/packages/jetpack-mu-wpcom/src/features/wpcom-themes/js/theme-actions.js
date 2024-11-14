const wpcomThemesRemoveWpcomActions = () => {
	const themeOverlay = document.querySelector( '.theme-overlay' );
	const themeBrowser = document.querySelector( '.theme-browser' );
	if ( ! themeOverlay || ! themeBrowser ) {
		return;
	}

	const observer = new MutationObserver( mutations => {
		for ( const mutation of mutations ) {
			for ( const node of mutation.addedNodes ) {
				const themeActions = node.querySelector( '.theme-actions .active-theme' );
				for ( const action of themeActions?.children ?? [] ) {
					if ( action.getAttribute( 'href' )?.includes( 'https://wordpress.com' ) ) {
						themeActions.removeChild( action );
					}
				}
			}
		}
	} );
	observer.observe( themeOverlay, { childList: true } );
	observer.observe( themeBrowser, { childList: true, subtree: true } );
};

document.addEventListener( 'DOMContentLoaded', wpcomThemesRemoveWpcomActions );
