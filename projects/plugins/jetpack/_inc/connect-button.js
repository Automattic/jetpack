/* global jpConnect */

jQuery( document ).ready( function ( $ ) {
	var connectButton = $( '.jp-connect-button, .jp-banner__alt-connect-button' ).eq( 0 );
	var tosText = $( '.jp-connect-full__tos-blurb' );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );
	// Sections that only show up in the first Set Up screen
	var connectionHelpSections = $(
		'#jetpack-connection-cards, .jp-connect-full__dismiss-paragraph, .jp-connect-full__testimonial'
	);
	// Sections that only show up in the "Authorize user" screen
	var connectButtonFrom = '';

	connectButton.on( 'click', function ( event ) {
		event.preventDefault();

		if ( 'undefined' === typeof URLSearchParams ) {
			connectButtonFrom = '';
		} else {
			var searchParams = new URLSearchParams( $( this ).prop( 'search' ) );
			connectButtonFrom = searchParams && searchParams.get( 'from' );
		}

		if ( connectionHelpSections.length ) {
			connectionHelpSections.fadeOut( 600 );
		}

		jetpackConnectButton.selectAndStartConnectionFlow();
	} );

	var jetpackConnectButton = {
		isRegistering: false,
		isPaidPlan: false,
		selectAndStartConnectionFlow: function () {
			var connectionHelpSections = $( '#jetpack-connection-cards, .jp-connect-full__testimonial' );
			if ( connectionHelpSections.length ) {
				connectionHelpSections.fadeOut( 600 );
			}

			if ( ! jetpackConnectButton.isRegistering ) {
				jetpackConnectButton.handleRegistration();
			}
		},
		handleRegistration: function () {
			// Alternative connection buttons should redirect to the main one for the "connect in place" flow.
			if ( connectButton.hasClass( 'jp-banner__alt-connect-button' ) ) {
				// Make sure we don't lose the `from` parameter, if set.
				var fromParam = ( connectButtonFrom && '&from=' + connectButtonFrom ) || '';
				window.location = jpConnect.connectInPlaceUrl + fromParam;
				return;
			}

			jetpackConnectButton.isRegistering = true;
			tosText.hide();
			connectButton.hide();
			jetpackConnectButton.triggerLoadingState();

			var registerUrl = jpConnect.apiBaseUrl + '/connection/register';

			// detect Calypso Env and add to API URL
			if ( window.Initial_State && window.Initial_State.calypsoEnv ) {
				registerUrl =
					registerUrl + '?' + $.param( { calypso_env: window.Initial_State.calypsoEnv } );
			}

			$.ajax( {
				url: registerUrl,
				type: 'POST',
				data: {
					registration_nonce: jpConnect.registrationNonce,
					_wpnonce: jpConnect.apiNonce,
				},
				error: jetpackConnectButton.handleConnectionError,
				success: function ( data ) {
					if ( data.hasWpcomAccount ) {
						if (
							confirm( 'Hey! Looks like you have a wpcom account. Connect with it?' ) === true
						) {
							window.location = data.authorizeUrl;
						} else {
							alert( 'Cool! No worries, continue user-less.' );
							window.location.reload();
						}
					} else {
						if ( confirm( 'Wanna create a wpcom account to do more cool stuff?' ) === true ) {
							window.location = data.authorizeUrl;
						} else {
							alert( 'Cool! No worries, continue user-less.' );
							window.location.reload();
						}
					}
				},
			} );
		},
		handleOriginalFlow: function () {
			window.location = connectButton.attr( 'href' );
		},
		triggerLoadingState: function () {
			var loadingText = $( '<span>' )
				.addClass( 'jp-connect-full__button-container-loading' )
				.text( jpConnect.buttonTextRegistering )
				.appendTo( '.jp-connect-full__button-container' );

			var spinner = $( '<div>' ).addClass( 'jp-spinner' );
			var spinnerOuter = $( '<div>' ).addClass( 'jp-spinner__outer' ).appendTo( spinner );
			$( '<div>' ).addClass( 'jp-spinner__inner' ).appendTo( spinnerOuter );
			loadingText.after( spinner );
		},
		handleConnectionError: function ( error ) {
			jetpackConnectButton.isRegistering = false;
			jetpackConnectButton.handleOriginalFlow();
		},
	};

	// When we visit /wp-admin/admin.php?page=jetpack#/setup, immediately start the connection flow.
	var hash = location.hash.replace( /(#\/setup).*/, 'setup' );

	// In case the parameter has been manually set in the URL after redirect.
	connectButtonFrom = location.hash.split( '&from=' )[ 1 ];

	if ( 'setup' === hash ) {
		if ( connectionHelpSections.length ) {
			connectionHelpSections.hide();
		}

		jetpackConnectButton.selectAndStartConnectionFlow();
	}
} );
