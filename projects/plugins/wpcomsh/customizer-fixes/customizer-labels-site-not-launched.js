( function() {
	var keys = Object.keys( window._wpCustomizeControlsL10nSitePrivate );
	keys.forEach( function ( key ) {
		window._wpCustomizeControlsL10n[ key ] = window._wpCustomizeControlsL10nSitePrivate[ key ];
	} );
} )();
