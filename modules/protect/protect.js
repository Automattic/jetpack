jQuery(document).ready( function() {
	jetpackProtectInit();
});

function jetpackProtectInit() {
	jQuery( '#editable-whitelist' ).on( 'click', '.delete-ip-address', function() {
		jetpackProtectDisableButtons();
		var data = jetppackProtectPreparePostData( jQuery( "#editable-whitelist" ).serializeArray() );
		var id = jQuery( this).data( 'id' );
		var omit = [
			'whitelist[new][ip_address]',
			'whitelist[new][range]',
			'whitelist[new][range_high]',
			'whitelist[new][range_low]',
			'whitelist[' + id + '][ip_address]',
			'whitelist[' + id + '][range]',
			'whitelist[' + id + '][range_high]',
			'whitelist[' + id + '][range_low]'
		];
		var postdata = _.omit( data, omit );
		jQuery.post( ajaxurl, postdata, function( response ) {
			jetpackProtectEnableButtons();
			if( response ) {
				console.log( response );
				jQuery( '#editable-whitelist #row-' + id ).detach();
			}
		}, 'json');
	} );
}

function jetpackProtectDisableButtons() {
	jQuery( '.delete-ip-address, .ip-add').attr( 'disabled', 'disabled' );
}

function jetpackProtectEnableButtons() {
	jQuery( '.delete-ip-address, .ip-add').removeAttr( 'disabled' );
}

function jetppackProtectPreparePostData( data ) {
	var keys = _.pluck( data, 'name' );
	var values = _.pluck( data, 'value' );
	var postdata = _.object( keys, values);
	return postdata;
}