jQuery( '#plugin-select-activate' ).click( function() {
	ajaxActivateModule( window.jetpackModuleInfo.module );
} );

function ajaxActivateModule( moduleName ) {
	var body = {};
	body[ moduleName ] = true;
	jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
	jQuery( '#plugin-select-activate' ).text( window.pluginSearchState.activatingString );
	jQuery.ajax( {
		url: '/wp-json/jetpack/v4/settings/',
		method: 'post',
		beforeSend: function( xhr ) {
			xhr.setRequestHeader( 'X-WP-Nonce', window.pluginSearchState.jetpackWPNonce );
		},
		data: window.JSON.stringify( body ),
		contentType: 'application/json',
		dataType: 'json'
	} ).done( function() {
		updateButton();
	} ).error( function() {
		jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
	} );
}

// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
function updateButton() {
	jQuery( '#plugin-select-activate' ).prop( 'onclick', null ).off( 'click' );
	jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
	jQuery( '#plugin-select-activate' ).text( window.pluginSearchState.activatedString );
	setTimeout( function() {
		jQuery( '#plugin-select-activate' ).replaceWith( '<a id="plugin-select-settings" class="button" href="' + window.jetpackModuleInfo.configure_url + '">' + window.pluginSearchState.manageSettingsString + '</a>' );
	}, 1000 );
}
