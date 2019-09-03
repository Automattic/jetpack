/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	var connectButton = $( '.jp-connect-button' );
	var tosText = $( '.jp-connect-full__tos-blurb' );
	connectButton.click( function( event ) {
		event.preventDefault();
		if ( ! jetpackConnectButton.isRegistering ) {
			if ( 'original' === jpConnect.forceVariation ) {
				// Forcing original connection flow, `JETPACK_SHOULD_USE_CONNECTION_IFRAME = false`.
				jetpackConnectButton.handleOriginalFlow();
			} else if ( 'in_place' === jpConnect.forceVariation ) {
				// Forcing new connection flow, `JETPACK_SHOULD_USE_CONNECTION_IFRAME = true`.
				jetpackConnectButton.handleConnectInPlaceFlow();
			} else {
				// Forcing A/B test driven connection flow variation, `JETPACK_SHOULD_USE_CONNECTION_IFRAME` not defined.
				jetpackConnectButton.startConnectionFlow();
			}
		}
	} );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );

	var jetpackConnectButton = {
		isRegistering: false,
		isPaidPlan: false,
		startConnectionFlow: function() {
			var abTestName = 'jetpack_connect_in_place';
			$.ajax( {
				url: 'https://public-api.wordpress.com/wpcom/v2/abtest/' + abTestName,
				type: 'GET',
				error: jetpackConnectButton.handleConnectionError,
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
			jetpackConnectButton.isRegistering = true;
			tosText.hide();
			connectButton
				.text( jpConnect.buttonTextRegistering )
				.attr( 'disabled', true )
				.blur();

			$.ajax( {
				url: jpConnect.apiBaseUrl + '/connection/register',
				type: 'POST',
				data: {
					registration_nonce: jpConnect.registrationNonce,
					_wpnonce: jpConnect.apiNonce,
				},
				error: jetpackConnectButton.handleConnectionError,
				success: function( data ) {
					jetpackConnectButton.fetchPlanType();
					window.addEventListener( 'message', jetpackConnectButton.receiveData );
					jetpackConnectIframe.attr( 'src', data.authorizeUrl );
					$( '.jp-connect-full__button-container' ).html( jetpackConnectIframe );
				},
			} );
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
					jetpackConnectButton.isPaidPlan = ! siteData.plan.is_free;
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
			window.location.reload( true );
		},
		handleConnectionError: function( error ) {
			console.warn( 'Connection failed. Falling back to the regular flow', error );
			jetpackConnectButton.isRegistering = false;
			jetpackConnectButton.handleOriginalFlow();
		},
	};
} );
