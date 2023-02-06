jQuery( document ).ready( function () {
	load_preload_status();
	setInterval( function () {
		load_preload_status();
	}, 1000 );
} );

/**
 *
 */
function load_preload_status() {
	jQuery.get( {
		url: wpsc_preload_ajax.preload_permalink_url + '?' + Math.random(),
		success: function ( response ) {
			jQuery( '#preload_status' ).text( response );
		},
	} );
}
