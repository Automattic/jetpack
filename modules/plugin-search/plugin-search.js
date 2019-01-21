
( function( $, pSS ) {
	const $pluginFilter = $( '#plugin-filter' );

	$pluginFilter.on( 'click', 'button#plugin-select-activate', function( event ) {
		event.preventDefault();
		ajaxActivateModule( $( this ).data( 'module' ) );
	} );

	function ajaxActivateModule( moduleName ) {
		const body = {};
		const $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
		body[ moduleName ] = true;
		$moduleBtn.toggleClass( 'install-now updating-message' );
		$moduleBtn.prop( 'disabled', true );
		$moduleBtn.text( pSS.activatingString );
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
			$moduleBtn.toggleClass( 'install-now updating-message' );
		} );
	}

	// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
	function updateButton() {
		const $moduleBtn = $pluginFilter.find( '#plugin-select-activate' );
		const configure_url = $moduleBtn.data( 'configure-url' );
		$moduleBtn.prop( 'onclick', null ).off( 'click' );
		$moduleBtn.toggleClass( 'install-now updating-message' );
		$moduleBtn.text( pSS.activatedString );
		setTimeout( function() {
			$moduleBtn.replaceWith( '<a id="plugin-select-settings" class="button" href="' + configure_url + '">' + pSS.manageSettingsString + '</a>' );
		}, 1000 );
	}
} )( jQuery, window.pluginSearchState );
