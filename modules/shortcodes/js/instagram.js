/* global window */

( function () {
	var instagramEmbed = function () {
		if (
			'undefined' !== typeof window.instgrm &&
			window.instgrm.Embeds &&
			'function' === typeof window.instgrm.Embeds.process
		) {
			window.instgrm.Embeds.process();
		} else {
			var s = document.createElement( 'script' );
			s.async = true;
			s.defer = true;
			s.src = '//platform.instagram.com/en_US/embeds.js';
			document.getElementsByTagName( 'body' )[ 0 ].appendChild( s );
		}
	};

	if ( 'undefined' !== typeof jQuery && 'undefined' !== typeof infiniteScroll ) {
		jQuery( document.body ).on( 'post-load', instagramEmbed );
	}

	instagramEmbed();
} )();
