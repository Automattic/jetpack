/* global jpConnect */

jQuery( document ).ready( function( $ ) {
	var connectButton = $( '.jp-connect-button' );
	var tosText = $( '.jp-connect-full__tos-blurb' );
	connectButton.click( function( event ) {
		event.preventDefault();
		$( '#jetpack-connection-cards' ).fadeOut( 600 );
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
	} );
	var jetpackConnectIframe = $( '<iframe class="jp-jetpack-connect__iframe" />' );

	var jetpackConnectButton = {
		isRegistering: false,
		isPaidPlan: false,
		startConnectionFlow: function() {
			var abTestName = 'jetpack_connect_in_place_v2';
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
			jetpackConnectIframe.attr( 'src', data.authorizeUrl );
			jetpackConnectIframe.on( 'load', function() {
				jetpackConnectIframe.show();
				$( '.jp-connect-full__button-container' ).hide();
			} );
			jetpackConnectIframe.hide();
			$( '.jp-connect-full__button-container' ).after( jetpackConnectIframe );
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
			jetpackConnectButton.isRegistering = false;
			jetpackConnectButton.handleOriginalFlow();
		},
	};
} );
