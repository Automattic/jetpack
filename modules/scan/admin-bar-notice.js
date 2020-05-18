( function( localized ) {
	function ready( fn ) {
		if ( document.readyState != 'loading' ) {
			fn();
		} else {
			document.addEventListener( 'DOMContentLoaded', fn );
		}
	}

	function fetch_scan_treats_and_add_link() {
		fetch( localized.scan_endpoint, {
			credentials: 'same-origin',
			headers: {
				'X-WP-Nonce': localized.nonce,
			},
		} )
			.then( function( response ) {
				if ( response.status >= 200 && response.status < 400 ) {
					return response.json();
				}
				return false;
			} )
			.then( function( body ) {
				if ( body && body.data ) {
					var apiResponse = JSON.parse( body.data );
					var numberOfThreats =
						apiResponse.threats && apiResponse.threats.length ? apiResponse.threats.length : 0;
					update_threats_link( numberOfThreats );
				} else {
					update_threats_link( 0 );
				}
			} );
	}

	ready( function() {
		fetch_scan_treats_and_add_link();
	} );

	function update_threats_link( numberOfThreats ) {
		var element = document.getElementById( 'wp-admin-bar-jp-scan-notice' );
		if ( ! numberOfThreats ) {
			element.parentNode.removeChild( element );
			return;
		}

		var textLabel = numberOfThreats == 1 ? localized.singular : localized.multiple;
		element.innerHTML =
			'<a href="' + localized.scan_dashboard_url + '" class="ab-item">' + textLabel + '</a>';
	}
} )( window.Jetpack_Scan );
