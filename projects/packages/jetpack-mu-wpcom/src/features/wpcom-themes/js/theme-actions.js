const wpcomThemesRemoveWpcomActions = () => {
	const themeOverlay = document.querySelector( '.theme-overlay' );
	if ( ! themeOverlay ) {
		return;
	}

	const observer = new MutationObserver( mutations => {
		for ( const mutation of mutations ) {
			for ( const node of mutation.addedNodes ) {
				// If this is not an overlay for the active theme, bail and check the next node.
				if (
					! node.classList.contains( 'theme-overlay' ) ||
					! node.classList.contains( 'active' )
				) {
					continue;
				}

				const themeActions = node.querySelector( '.theme-actions .active-theme' );
				for ( const action of themeActions?.children ?? [] ) {
					if ( action.getAttribute( 'href' )?.includes( 'https://wordpress.com' ) ) {
						themeActions.removeChild( action );
					}
				}
				return;
			}
		}
	} );

	observer.observe( themeOverlay, { childList: true } );
};

document.addEventListener( 'DOMContentLoaded', wpcomThemesRemoveWpcomActions );
