
( function( $, pSS ) {
	const $pluginFilter = $( '#plugin-filter' );

	$pluginFilter.on( 'click', 'button#plugin-select-activate', function( event ) {
		event.preventDefault();
		ajaxActivateModule( $( this ).data( 'module' ) );
	} );

	function ajaxActivateModule( moduleName ) {
		const body = {};
		const $moduleBox = $pluginFilter.find( '#plugin-select-activate' );
		body[ moduleName ] = true;
		$moduleBox.toggleClass( 'install-now updating-message' );
		$moduleBox.text( pSS.activatingString );
		$.ajax( {
			url: pSS.rest_url,
			method: 'post',
			beforeSend: function( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', pSS.jetpackWPNonce );
			},
			data: window.JSON.stringify( body ),
			contentType: 'application/json',
			dataType: 'json'
		} ).done( function() {
			updateButton();
		} ).error( function() {
			$( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
		} );
	}

	// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
	function updateButton() {
		const $moduleBox = $pluginFilter.find( '#plugin-select-activate' );
		$moduleBox.prop( 'onclick', null ).off( 'click' );
		$moduleBox.toggleClass( 'install-now updating-message' );
		$moduleBox.text( pSS.activatedString );
		setTimeout( function() {
			$moduleBox.replaceWith( '<a id="plugin-select-settings" class="button" href="' + window.jetpackModuleInfo.configure_url + '">' + pSS.manageSettingsString + '</a>' );
		}, 1000 );
	}
} )( jQuery, window.pluginSearchState );
