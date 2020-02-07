( function() {
	var keys = Object.keys( window._wpCustomizeControlsL10nSitePrivate );
	keys.forEach( function ( key ) {
		window._wpCustomizeControlsL10n[ key ] = window._wpCustomizeControlsL10nSitePrivate[ key ];
	} );

	document.addEventListener( 'DOMContentLoaded', function() {
		// Update Publish Label in Gear Status Options
		var statusPublishInput = document.querySelector( "[id^='customize-selected-changeset-status-control-input-'][value='publish']" );
		statusPublishInput.parentElement.querySelector( 'label' ).textContent = window._wpCustomizeControlsL10nSitePrivate.publish;
	} );
} )();
