jQuery( document ).ready( function( $ ) {
	var body = $( 'body' ),
		rememberMe = $( '#rememberme' ),
		ssoButton = $( 'a.jetpack-sso.button' ),
		toggleSSO = $( '.jetpack-sso-toggle' ),
		userLogin = $( '#user_login' );

	rememberMe.on( 'change', function() {
		var url       = ssoButton.prop( 'href' ),
			isChecked = rememberMe.prop( 'checked' ) ? 1 : 0;

		if ( url.match( /&rememberme=\d/ ) ) {
			url = url.replace( /&rememberme=\d/, '&rememberme=' + isChecked );
		} else {
			url += '&rememberme=' + isChecked;
		}

		ssoButton.prop( 'href', url );
	} ).change();

	toggleSSO.on( 'click', function( e ) {
		e.preventDefault();
		body.toggleClass( 'jetpack-sso-body' );
		if ( ! body.hasClass( 'jetpack-sso-body' ) ) {
			userLogin.focus();
		}
	} );
} );
