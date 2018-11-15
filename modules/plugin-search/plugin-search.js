jQuery( '#plugin-select-activate' ).click( function() {
	ajaxActivateModule( jetpackModuleInfo.module );
} );

function ajaxActivateModule( moduleName ) {
	const body = {};
	body[ moduleName ] = true;
	jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
	jQuery( '#plugin-select-activate' ).text( pluginSearchState.activatingString );
	jQuery.ajax( {
		url: '/wp-json/jetpack/v4/settings/',
		method: 'post',
		beforeSend: function( xhr ) {
			xhr.setRequestHeader( 'X-WP-Nonce', pluginSearchState.jetpackWPNonce );
		},
		data: JSON.stringify( body ),
		contentType: 'application/json',
		dataType: 'json'
	} ).done( function( response ) {
		updateButton();
		console.log( response );
	} ).error( function( error ) {
		jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
		console.log( error.responseText );
	} );
}

// Remove onclick handler, disable loading spinner, update button to redirect to module settings.
function updateButton() {
	jQuery( '#plugin-select-activate' ).prop( 'onclick', null ).off( 'click' );
	jQuery( '#plugin-select-activate' ).toggleClass( 'install-now updating-message' );
	jQuery( '#plugin-select-activate' ).text( pluginSearchState.activatedString );
	setTimeout( function() {
		jQuery( '#plugin-select-activate' ).replaceWith( '<a id="plugin-select-settings" class="button" href="' + jetpackModuleInfo.configure_url + '">' + pluginSearchState.manageSettingsString + '</a>' );
	}, 1000 );
}
