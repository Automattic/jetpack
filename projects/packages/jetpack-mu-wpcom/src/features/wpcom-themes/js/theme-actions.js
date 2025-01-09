/* global wpcomThemesActions */

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

	// Add the "Add new theme" action to the page header, if there isn't one already.
	const pageTitle = document.querySelector( '.wp-heading-inline' );
	const addButton = document.querySelector( '.page-title-action' );
	if ( pageTitle && ! addButton ) {
		pageTitle.insertAdjacentHTML(
			'afterend',
			`<a href="${ wpcomThemesActions.addNewUrl }" class="page-title-action">${ wpcomThemesActions.addNewLabel }</a>`
		);
	}
};

document.addEventListener( 'DOMContentLoaded', wpcomThemesRemoveWpcomActions );
