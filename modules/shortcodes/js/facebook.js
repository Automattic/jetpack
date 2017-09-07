/* global FB, jpfbembed */
(function( window ) {
	var facebookEmbed = function() {
		if ( 'undefined' !== typeof FB && FB.XFBML ) {
			FB.XFBML.parse();
		} else {
			var fbroot = document.createElement( 'div' );
			fbroot.id = 'fb-root';
			document.getElementsByTagName( 'body' )[0].appendChild( fbroot );

			jQuery.getScript( '//connect.facebook.net/en_US/sdk.js' );
		}
	};

	window.fbAsyncInit = function() {
		FB.init( {
			appId  : jpfbembed.appid,
			version: 'v2.3'
		} );

		FB.XFBML.parse();
	};

	if ( 'undefined' !== typeof infiniteScroll ) {
		jQuery( document.body ).on( 'post-load', facebookEmbed );
	}

	facebookEmbed();
})( this );
