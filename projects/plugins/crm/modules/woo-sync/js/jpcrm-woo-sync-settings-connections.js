/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WooSync Settings and Connections pages JS
 */

jQuery( function ( $ ) {
	// Bind add connection
	jpcrm_woosync_bind_add_connection();
} );

/*
 * Bind add connection
 */
/**
 *
 */
function jpcrm_woosync_bind_add_connection() {
	jQuery( '#jpcrm-woosync-connect-to-store' ).on( 'click', function () {
		var swal_HTML =
			'<div style="font-size: 1.2em;padding: 0.3em;">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-site-url' ) +
			'<br />' +
			'<div class="ui input" style="width: 350px;"><input type="text" name="jpcrm-connect-woocommerce-store-url" id="jpcrm-connect-woocommerce-store-url" value="" placeholder="' +
			zeroBSCRMJS_globViewLang( 'connect-woo-site-placeholder' ) +
			'" /></div>' +
			'<div class="jpcrm-woosync-add-connection-errors">' +
			'<div class="ui hidden pointing red basic label" id="jpcrm-woosync-connect-to-store-invalid-url-empty">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-invalid-url-empty' ) +
			'</div>' +
			'<div class="ui hidden pointing red basic label" id="jpcrm-woosync-connect-to-store-invalid-url">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-invalid-url-detail' ) +
			'</div>' +
			'<div class="ui hidden pointing red basic label" id="jpcrm-woosync-connect-to-store-invalid-url-http">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-invalid-url-http' ) +
			'</div>' +
			'<div class="ui hidden pointing red basic label" id="jpcrm-woosync-connect-to-store-invalid-url-duplicate">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-invalid-url-duplicate' ) +
			'</div>' +
			'<div class="ui hidden pointing red basic label" id="jpcrm-woosync-connect-to-store-ajax-error">' +
			zeroBSCRMJS_globViewLang( 'connect-woo-ajax-error' ) +
			'</div>' +
			'</div>' +
			'</div>';

		// show a sweet alert asking for the site URL
		swal( {
			title: '<i class="plug icon"></i> ' + zeroBSCRMJS_globViewLang( 'connect-woo' ),
			html: swal_HTML,
			type: '',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: zeroBSCRMJS_globViewLang( 'connect-woo-go' ),
			cancelButtonText: zeroBSCRMJS_globViewLang( 'cancel' ),
			customClass: 'swal-wide',
			preConfirm: function () {
				// get value
				var site_url = jpcrm_strip_trailing_slashes(
					jQuery( '#jpcrm-connect-woocommerce-store-url' ).val()
				);

				// return promise
				return new Promise( function ( resolve, reject ) {
					// hide all notices each try
					jQuery( '.jpcrm-woosync-add-connection-errors > div' ).addClass( 'hidden' );

					// disallow empty string
					if ( site_url === '' ) {
						// error, show notice
						jQuery( '#jpcrm-woosync-connect-to-store-invalid-url-empty' ).removeClass( 'hidden' );
						reject();
						return false;
					}

					// disallow duplicate URL
					else if (
						window.zbs_root.woosync_connections &&
						window.zbs_root.woosync_connections.indexOf( site_url ) >= 0
					) {
						// error, show notice
						jQuery( '#jpcrm-woosync-connect-to-store-invalid-url-duplicate' ).removeClass(
							'hidden'
						);
						reject();
						return false;
					}

					// disallow http
					else if ( site_url.substring( 0, 5 ) == 'http:' ) {
						// error, show notice
						jQuery( '#jpcrm-woosync-connect-to-store-invalid-url-http' ).removeClass( 'hidden' );
						reject();
						return false;
					}

					// catch protocol-less urls by adding https://
					if ( site_url.substring( 0, 8 ) !== 'https://' ) {
						site_url = 'https://' + site_url;
					}

					// disallow values that don't look like URLs
					if ( ! jpcrm_looks_like_URL( site_url ) ) {
						// error, show notice
						jQuery( '#jpcrm-woosync-connect-to-store-invalid-url' ).removeClass( 'hidden' );
						reject();
						return false;
					}
					// post via AJAX to receive a new woo auth url (creates a transient to be caught)
					var data = {
						action: 'jpcrm_woosync_get_auth_url',
						sec: window.zbs_root.woosync_token,
						site_url: site_url,
					};

					// Send
					jQuery.ajax( {
						type: 'POST',
						url: ajaxurl,
						data: data,
						dataType: 'json',
						timeout: 20000,
						success: function ( response ) {
							//console.log( 'requested url: ', response );

							if ( typeof response.target_url !== 'undefined' ) {
								// redirect
								window.location.replace( response.target_url );
							} else {
								// error, show notice
								jQuery( '#jpcrm-woosync-connect-to-store-ajax-error' ).removeClass( 'hidden' );
							}

							// fini
							resolve();
						},
						error: function ( response ) {
							// error, show notice
							jQuery( '#jpcrm-woosync-connect-to-store-ajax-error' ).removeClass( 'hidden' );

							// fini
							resolve();
						},
					} );
				} ).catch( err => {
					return false;
				} );
			},
		} ).then( function ( result ) {
			// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
			if ( result.value ) {
			}
		} );
	} );
}

/*
 * Hides error notice when url is valid
 */
/**
 *
 */
function jpcrm_woosync_bind_add_connection_inputchange() {
	jQuery( '#jpcrm-connect-woocommerce-store-url' ).on( 'change', function () {
		if ( jpcrm_looks_like_URL( jQuery( this ).val() ) ) {
			// hide any notice
			jQuery( '#jpcrm-woosync-connect-to-store-invalid-url' ).addClass( 'hidden' );
		}
	} );
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_woosync_bind_add_connection, jpcrm_woosync_bind_add_connection_inputchange };
}