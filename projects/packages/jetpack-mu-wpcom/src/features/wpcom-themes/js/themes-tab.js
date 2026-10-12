/* global wpcomThemesTab */

// Runs before DOM ready, so core's theme.js finds the tab when it routes `?browse=wpcom`.
( () => {
	const list = document.querySelector( '.wp-filter .filter-links' );
	if ( ! list || ! window.wpcomThemesTab ) {
		return;
	}

	const link = document.createElement( 'a' );
	link.href = '#';
	link.dataset.sort = wpcomThemesTab.sort;
	link.textContent = wpcomThemesTab.label;

	const item = document.createElement( 'li' );
	item.appendChild( link );
	list.prepend( item );
} )();
