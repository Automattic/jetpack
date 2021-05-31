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
		selectAndStartAuthorizationFlow: function ( data ) {
			if ( data.allowInplaceAuthorization && 'original' !== jpConnect.forceVariation ) {
				jetpackConnectButton.handleAuthorizeInPlaceFlow( data );
			} else {
				// Forcing original connection flow, `JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME = true`
				// or we're dealing with Safari which has issues with handling 3rd party cookies.
				if ( data.alternateAuthorizeUrl ) {
					window.location = data.alternateAuthorizeUrl;
				} else {
					window.location = data.authorizeUrl;
				}
			}
		},
		handleConnection: function () {
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
					from: connectButtonFrom,
					no_iframe: 'original' === jpConnect.forceVariation,
				},
				error: jetpackConnectButton.handleConnectionError,
				success: jetpackConnectButton.selectAndStartAuthorizationFlow,
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
		handleAuthorizeInPlaceFlow: function ( data ) {
			window.addEventListener( 'message', jetpackConnectButton.receiveData );
			jetpackConnectIframe.attr(
				'src',
				data.authorizeUrl + '&from=' + connectButtonFrom + '&iframe_source=jetpack-connect-main'
			);
			jetpackConnectIframe.on( 'load', function () {
				jetpackConnectIframe.show();
				$( '.jp-connect-full__button-container' ).hide();
				$( '#jp-connect-full__step1-header' ).hide();
				$( '#jp-connect-full__step2-header' ).show();
			} );
			jetpackConnectIframe.hide();
			$( '.jp-connect-full__button-container' ).after( jetpackConnectIframe );

			// At this point we are pretty sure if things work out that we will be loading the admin script
			var link = document.createElement( 'link' );
			link.rel = 'preload';
			link.as = 'script';
			link.href = jpConnect.preFetchScript;
			document.head.appendChild( link );
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
			if (
				event.origin !== jpConnect.jetpackApiDomain ||
				event.source !== jetpackConnectIframe.get( 0 ).contentWindow
			) {
				return;
			}

			switch ( event.data ) {
				case 'close':
					window.removeEventListener( 'message', this.receiveData );
					jetpackConnectButton.handleAuthorizationComplete();
					break;
				case 'wpcom_nocookie':
					jetpackConnectIframe.hide();
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

	// When we visit /wp-admin/admin.php?page=jetpack#/setup, immediately start the connection flow.
	var hash = location.hash.replace( /(#\/setup).*/, 'setup' );

	// In case the parameter has been manually set in the URL after redirect.
	connectButtonFrom = location.hash.split( '&from=' )[ 1 ];

	if ( 'setup' === hash ) {
		if ( connectionHelpSections.length ) {
			connectionHelpSections.hide();
		}

		jetpackConnectButton.startConnectionFlow();
	}
} );
