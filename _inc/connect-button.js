/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	$( '.jp-connect-button' ).click( function( event ) {
		event.preventDefault();
		if ( ! jetpackConnectButton.isRegistering ) {
			jetpackConnectButton.handleClick();
		}
	} );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );

	var jetpackConnectButton = {
		isRegistering: false,
		handleClick: function() {
			jetpackConnectButton.isRegistering = true;
			$( '.jp-connect-button' ).text( jpConnect.buttonTextRegistering );
			$.ajax( {
				url: jpConnect.apiBaseUrl + '/connection/register',
				type: 'POST',
				data: {
					registration_nonce: jpConnect.registrationNonce,
					_wpnonce: jpConnect.apiNonce,
				},
				error: function( error ) {
					console.warn( error );
					jetpackConnectButton.isRegistering = false;
					$( '.jp-connect-button' ).text( jpConnect.buttonTextDefault );
				},
				success: function( data ) {
					window.addEventListener( 'message', jetpackConnectButton.receiveData );
					jetpackConnectIframe.attr( 'src', data.authorizeUrl );
					$( '.jp-connect-full__button-container' ).html( jetpackConnectIframe );
				},
			} );
		},
		receiveData: function( event ) {
			if (
				event.origin === 'https://jetpack.wordpress.com' &&
				event.source === jetpackConnectIframe.get( 0 ).contentWindow
			) {
				if ( event.data === 'close' ) {
					window.removeEventListener( 'message', this.receiveData );
					jetpackConnectButton.handleAuthorizationComplete();
				}
			}
		},
		handleAuthorizationComplete: function() {
			jetpackConnectButton.isRegistering = false;
			$( '.jp-connect-full__button-container' ).html(
				'<p>' + jpConnect.buttonTextFinishing + '<p>'
			);
			location.reload();
		},
	};
} );
