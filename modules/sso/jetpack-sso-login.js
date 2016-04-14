jQuery( document ).ready( function( $ ) {
	var ssoWrap = $( '#jetpack-sso-wrap' ),
		rememberMe = $( '#rememberme' ),
		ssoButton  = $( 'a.jetpack-sso.button' );

	// If forcing SSO, then let's remove the default login form
	if ( ssoWrap.hasClass( 'forced-sso' ) ) {
		$( '#loginform' ).empty();
	}

	$( '#loginform' ).append( ssoWrap );

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
} );
