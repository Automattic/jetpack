/* global jetpack_broken_token_connection_errors */
( function ( $ ) {
	$( '.verify-error' ).click( function () {
		const button = this;
		$( button ).prop( 'disabled', true );
		const orignialValue = $( button ).val();
		$( button ).val( 'Sending request...' );

		$.post(
			jetpack_broken_token_connection_errors.verify_error_url,
			{
				nonce: $( this ).data( 'nonce' ),
			},
			function () {
				$( button ).val( 'Updating list...' );

				$.post(
					jetpack_broken_token_connection_errors.admin_post_url,
					{
						_wpnonce: jetpack_broken_token_connection_errors.refresh_verified_errors_nonce,
						action: 'refresh_verified_errors_list',
					},
					function ( response ) {
						$( button ).prop( 'disabled', false );
						$( button ).val( orignialValue );

						$( '#verified_errors_list' ).html( response );
					}
				);
			}
		);
	} );
} )( jQuery );
