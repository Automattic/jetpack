/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/*
	Javascript for admin systems pages
 */
jQuery( document ).ready( function () {
	// init
	jpcrm_init_systempage();
} );

/**
 * Initialise the page.
 */
function jpcrm_init_systempage() {
	//jQuery('.tabular.menu .item').tab();
	jQuery( '#jpcrm-system-manager .tabular.menu .item' ).tab( {
		context: '#jpcrm-system-manager',
	} );

	// change address bar URL when clicking a tab
	jQuery( '#jpcrm-system-manager .tabular.menu .item' ).on( 'click', function ( e ) {
		const clicked_tab = e.currentTarget;
		// tab_title = clicked_tab.innerHTML;
		const tab_slug = clicked_tab.dataset.tab;
		const new_url = document.URL.replace(
			/(\?page=zerobscrm-systemstatus).*/,
			'$1' + '&tab=' + tab_slug
		);
		history.replaceState( null, null, new_url );
	} );

	// accordian
	jQuery( '.ui.accordion' ).accordion();
}

if ( typeof module !== 'undefined' ) {
	module.exports = { jpcrm_init_systempage };
}
