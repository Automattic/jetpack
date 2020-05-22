/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	var connectButton = $( '.jp-connect-button, .jp-banner__alt-connect-button' ).eq( 0 );
	var tosText = $( '.jp-connect-full__tos-blurb' );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );
	var connectionHelpSections = $(
		'#jetpack-connection-cards, .jp-connect-full__dismiss-paragraph'
	);
	var connectButtonFrom = '';

	connectButton.on( 'click', function( event ) {
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
		selectAndStartConnectionFlow: function() {
			var connectionHelpSections = $( '#jetpack-connection-cards' );
			if ( connectionHelpSections.length ) {
				connectionHelpSections.fadeOut( 600 );
			}

			if ( ! jetpackConnectButton.isRegistering ) {
				if ( 'original' === jpConnect.forceVariation ) {
					// Forcing original connection flow, `JETPACK_SHOULD_USE_CONNECTION_IFRAME = false`
					// or we're dealing with Safari which has issues with handling 3rd party cookies.
					jetpackConnectButton.handleOriginalFlow();
				} else if ( 'in_place' === jpConnect.forceVariation ) {
					// Forcing new connection flow, `JETPACK_SHOULD_USE_CONNECTION_IFRAME = true`.
					jetpackConnectButton.handleConnectInPlaceFlow();
				} else {
					// Forcing A/B test driven connection flow variation, `JETPACK_SHOULD_USE_CONNECTION_IFRAME` not defined.
					jetpackConnectButton.startConnectionFlow();
				}
			}
		},
		startConnectionFlow: function() {
			var abTestName = 'jetpack_connect_in_place_v4';

			$.ajax( {
				url: 'https://public-api.wordpress.com/wpcom/v2/abtest/' + abTestName,
				type: 'GET',
				error: jetpackConnectButton.handleConnectionError,
				data: jpConnect.identity,
				xhrFields: {
					withCredentials: true,
				},
				crossDomain: true,
				success: function( data ) {
					if ( data && 'in_place' === data.variation ) {
						jetpackConnectButton.handleConnectInPlaceFlow();
						return;
					}
					jetpackConnectButton.handleOriginalFlow();
				},
			} );
		},
		handleOriginalFlow: function() {
			window.location = connectButton.attr( 'href' );
		},
		handleConnectInPlaceFlow: function() {
			// Alternative connection buttons should redirect to the main one for the "connect in place" flow.
			if ( connectButton.hasClass( 'jp-banner__alt-connect-button' ) ) {
				window.location = jpConnect.connectInPlaceUrl;
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
				success: jetpackConnectButton.handleConnectionSuccess,
			} );
		},
		triggerLoadingState: function() {
			var loadingText = $( '<span>' )
				.addClass( 'jp-connect-full__button-container-loading' )
				.text( jpConnect.buttonTextRegistering )
				.appendTo( '.jp-connect-full__button-container' );

			var spinner = $( '<div>' ).addClass( 'jp-spinner' );
			var spinnerOuter = $( '<div>' )
				.addClass( 'jp-spinner__outer' )
				.appendTo( spinner );
			$( '<div>' )
				.addClass( 'jp-spinner__inner' )
				.appendTo( spinnerOuter );
			loadingText.after( spinner );
		},
		handleConnectionSuccess: function( data ) {
			jetpackConnectButton.fetchPlanType();
			window.addEventListener( 'message', jetpackConnectButton.receiveData );
			jetpackConnectIframe.attr( 'src', data.authorizeUrl + '&from=' + connectButtonFrom );
			jetpackConnectIframe.on( 'load', function() {
				jetpackConnectIframe.show();
				$( '.jp-connect-full__button-container' ).hide();
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
		fetchPlanType: function() {
			$.ajax( {
				url: jpConnect.apiBaseUrl + '/site',
				type: 'GET',
				data: {
					_wpnonce: jpConnect.apiSiteDataNonce,
				},
				success: function( data ) {
					var siteData = JSON.parse( data.data );
					jetpackConnectButton.isPaidPlan =
						siteData.options.is_pending_plan || ! siteData.plan.is_free;
				},
			} );
		},
		receiveData: function( event ) {
			if (
				event.origin === jpConnect.jetpackApiDomain &&
				event.source === jetpackConnectIframe.get( 0 ).contentWindow &&
				event.data === 'close'
			) {
				window.removeEventListener( 'message', this.receiveData );
				jetpackConnectButton.handleAuthorizationComplete();
			}
		},
		handleAuthorizationComplete: function() {
			jetpackConnectButton.isRegistering = false;

			if ( jetpackConnectButton.isPaidPlan ) {
				window.location.assign( jpConnect.dashboardUrl );
			} else {
				window.location.assign( jpConnect.plansPromptUrl );
			}

			// The Jetpack admin page has hashes in the URLs, so we need to reload the page after .assign()
			if ( window.location.hash ) {
				window.location.reload( true );
			}
		},
		handleConnectionError: function( error ) {
			jetpackConnectButton.isRegistering = false;
			jetpackConnectButton.handleOriginalFlow();
		},
	};

	// When we visit /wp-admin/admin.php?page=jetpack#/setup, immediately start the connection flow.
	var hash = location.hash.replace( /#\//, '' );
	if ( 'setup' === hash ) {
		if ( connectionHelpSections.length ) {
			connectionHelpSections.hide();
		}

		jetpackConnectButton.selectAndStartConnectionFlow();
	}
} );
