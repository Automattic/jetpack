( function( $ ) {
	$( '.verify-error' ).click( function( ev ) {
		var button = this;
		$( button ).prop( 'disabled', true );
		var orignialValue = $( button ).val();
		$( button ).val( 'Sending request...' );

		$.post(
			jetpack_broken_token_xmlrpc_errors.verify_error_url,
			{
				nonce: $( this ).data( 'nonce' ),
			},
			function( response ) {
				$( button ).val( 'Updating list...' );

				$.post(
					jetpack_broken_token_xmlrpc_errors.admin_post_url,
					{
						_wpnonce: jetpack_broken_token_xmlrpc_errors.refresh_verified_errors_nonce,
						action: 'refresh_verified_errors_list',
					},
					function( response ) {
						$( button ).prop( 'disabled', false );
						$( button ).val( orignialValue );

						$( '#verified_errors_list' ).html( response );
					}
				);
			}
		);
	} );
} )( jQuery );
