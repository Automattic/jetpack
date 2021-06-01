/* global jpConnect */

jQuery( document ).ready( function ( $ ) {
	var connectButton = $( '.jp-connect-button, .jp-banner__alt-connect-button' ).eq( 0 );

	connectButton.on( 'click', function ( event ) {
		event.preventDefault();
		jetpackConnectButton.registerSite();
	} );

	var jetpackConnectButton = {
		registerSite: function () {
			var connectionHelpSections = $(
				'#jetpack-connection-cards, .jp-connect-full__testimonial, .jp-connect-full__dismiss-paragraph'
			);
			if ( connectionHelpSections.length ) {
				connectionHelpSections.fadeOut( 600 );
			}
			$( '.jp-connect-full__tos-blurb' ).hide();

			connectButton.hide();

			// trigger loading state
			var loadingText = $( '<span>' )
				.addClass( 'jp-connect-full__button-container-loading' )
				.text( jpConnect.buttonTextRegistering )
				.appendTo( '.jp-connect-full__button-container' );

			var spinner = $( '<div>' ).addClass( 'jp-spinner' );
			var spinnerOuter = $( '<div>' ).addClass( 'jp-spinner__outer' ).appendTo( spinner );
			$( '<div>' ).addClass( 'jp-spinner__inner' ).appendTo( spinnerOuter );
			loadingText.after( spinner );

			// register site
			var registerUrl = jpConnect.apiBaseUrl + '/connection/register';
			var connectButtonFrom;

			if ( 'undefined' === typeof URLSearchParams ) {
				connectButtonFrom = '';
			} else {
				var searchParams = new URLSearchParams( connectButton.prop( 'search' ) );
				connectButtonFrom = searchParams && searchParams.get( 'from' );
			}

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
					from: connectButtonFrom,
					no_iframe: 'original' === jpConnect.forceVariation,
				},
				error: jetpackConnectButton.handleRegisterError,
				success: jetpackConnectButton.handleRegisterSuccess,
			} );
		},
		handleRegisterSuccess: function ( data ) {
			if ( window.location.href == jpConnect.dashboardUrl ) {
				window.location.reload();
			} else {
				window.location.assign( jpConnect.dashboardUrl );
			}
		},
		handleRegisterError: function ( error ) {
			// TODO - ask user to retry
			console.error( error );
			// If something goes wrong, we take users to Calypso.
			window.location = connectButton.attr( 'href' );
		},
	};

	// When we visit /wp-admin/admin.php?page=jetpack#/setup, immediately start the connection flow.
	var hash = location.hash.replace( /(#\/setup).*/, 'setup' );

	// In case the parameter has been manually set in the URL after redirect.
	// connectButtonFrom = location.hash.split( '&from=' )[ 1 ];

	if ( 'setup' === hash ) {
		jetpackConnectButton.registerSite();
	}
} );
