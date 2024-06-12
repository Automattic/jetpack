( function() {
	var keys = Object.keys( window._wpCustomizeControlsL10nSitePrivate );
	keys.forEach( function ( key ) {
		window._wpCustomizeControlsL10n[ key ] = window._wpCustomizeControlsL10nSitePrivate[ key ];
	} );

	document.addEventListener(
		'DOMContentLoaded',
		function() {
			// Update Publish label used to populate Customizer save options.
			var choices = window._wpCustomizeSettings?.changeset?.statusChoices ?? [];
			for ( var i = 0; i < choices.length; ++i ) {
				if ( 'publish' === choices[i].status ) {
					choices[i].label = window._wpCustomizeControlsL10nSitePrivate.publish;
					return;
				}
			}
		},
		// Use capture phase because it won't hurt to do this earlier
		true
	);
} )();
