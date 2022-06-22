/* global jpConnect */

jQuery( document ).ready( function ( $ ) {
	var connectButton = $( '.jp-connect-button, #jp-connect-button--alt' ).eq( 0 );
	var tosText = $( '.jp-connect-full__tos-blurb' );
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

		jetpackConnectButton.startConnectionFlow();
	} );

	var jetpackConnectButton = {
		isRegistering: false,
		isPaidPlan: false,
		startConnectionFlow: function () {
			var connectionHelpSections = $( '#jetpack-connection-cards, .jp-connect-full__testimonial' );
			if ( connectionHelpSections.length ) {
				connectionHelpSections.fadeOut( 600 );
			}

			if ( ! jetpackConnectButton.isRegistering ) {
				jetpackConnectButton.handleConnection();
			}
		},
		startAuthorizationFlow: function ( data ) {
			if ( data.alternateAuthorizeUrl ) {
				window.location = data.alternateAuthorizeUrl;
			} else {
				window.location = data.authorizeUrl;
			}
		},
		handleConnection: function () {
			// Alternative connection buttons should redirect to the main one for the "connect in place" flow.
			if ( connectButton.attr( 'id' ) === 'jp-connect-button--alt' ) {
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
					from: connectButtonFrom,
				},
				error: jetpackConnectButton.handleConnectionError,
				success: jetpackConnectButton.startAuthorizationFlow,
			} );
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
		fetchPlanType: function () {
			return $.ajax( {
				url: jpConnect.apiBaseUrl + '/site',
				type: 'GET',
				data: {
					_wpnonce: jpConnect.apiSiteDataNonce,
				},
				success: function ( data ) {
					var siteData = JSON.parse( data.data );
					jetpackConnectButton.isPaidPlan =
						siteData.options.is_pending_plan || ! siteData.plan.is_free;
				},
			} );
		},
		receiveData: function ( event ) {
			if ( event.origin !== jpConnect.jetpackApiDomain ) {
				return;
			}

			switch ( event.data ) {
				case 'close':
					window.removeEventListener( 'message', this.receiveData );
					jetpackConnectButton.handleAuthorizationComplete();
					break;
				case 'wpcom_nocookie':
					jetpackConnectButton.handleConnectionError();
					break;
			}
		},
		handleAuthorizationComplete: function () {
			jetpackConnectButton.isRegistering = false;

			// Fetch plan type late to make sure any stored license keys have been
			// attached to the site during the connection.
			jetpackConnectButton.fetchPlanType().always( function () {
				if ( ! jetpackConnectButton.isPaidPlan ) {
					window.location.assign( jpConnect.plansPromptUrl );
					return;
				}

				var parser = document.createElement( 'a' );
				parser.href = jpConnect.dashboardUrl;
				var reload =
					window.location.pathname === parser.pathname &&
					window.location.hash.length &&
					parser.hash.length;

				window.location.assign( jpConnect.dashboardUrl );

				if ( reload ) {
					// The Jetpack admin page has hashes in the URLs, so we need to reload the page after .assign()
					window.location.reload( true );
				}
			} );
		},
		handleConnectionError: function ( error ) {
			jetpackConnectButton.isRegistering = false;
			// If something goes wrong, we take users to Calypso.
			window.location = connectButton.attr( 'href' );
		},
	};

	// In case the parameter has been manually set in the URL after redirect.
	connectButtonFrom = location.hash.split( '&from=' )[ 1 ];
} );
