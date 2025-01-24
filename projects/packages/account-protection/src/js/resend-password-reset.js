/* global jQuery, ajaxObject */
( function ( $ ) {
	$( document ).ready( function () {
		const attemptLimit = 3;
		let attempts = 0;

		$( '#resend-password-reset' ).on( 'click', function ( e ) {
			e.preventDefault(); // Prevent the default action

			const message = $( '#resend-password-reset-message' );
			const button = $( this );

			// Store the original text of the message
			const originalMessageText = message.text();

			// Update message and hide button while resending
			message.text( 'Resending email...' );
			button.hide();

			attempts++;

			// Perform the AJAX request
			$.ajax( {
				url: ajaxObject.ajax_url,
				type: 'POST',
				data: {
					action: 'resend_password_reset',
					security: ajaxObject.nonce,
				},
				success: function ( response ) {
					if ( response.success ) {
						// Show success message
						message.text( response.data.message ).show();

						// Hide the status message and show the button after 5 seconds
						setTimeout( function () {
							let messageText = originalMessageText;
							if ( attempts < attemptLimit ) {
								button.show();
							} else {
								messageText += 'Please try again later.';
							}
							message.text( messageText ).show();
						}, 5000 );
					} else {
						// Show error message
						let messageText = 'An error occurred. ';
						if ( attempts < attemptLimit ) {
							button.text( 'Please try again' ).show();
						} else {
							messageText += 'Please contact support.'; // TODO: Add support redirect
						}

						message.text( messageText ).show();
					}
				},
				error: function () {
					// Show error message
					let messageText = 'An error occurred. ';
					if ( attempts < attemptLimit ) {
						button.text( 'Please try again' ).show();
					} else {
						messageText += 'Please contact support.'; // TODO: Add support redirect
					}

					message.text( messageText ).show();
				},
			} );
		} );
	} );
} )( jQuery );
