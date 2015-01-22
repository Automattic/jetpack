var jetpackProtect = {
	range : false,
	newIPKey : 0
};

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
				jQuery( '#editable-whitelist #row-' + id ).detach();
			}
		}, 'json');
	} );

	jQuery( '#editable-whitelist').on( 'click', '.ip-range-toggle', function() {
		var html_template = jQuery( this).data( 'template' );
		var row = _.template(
			jQuery('script.' + html_template ).html()
		);
		jQuery( '#jetpack-protect-new-ip').html( row() );
		jetpackProtect.range = !jetpackProtect.range;
	} );

	jQuery( '#editable-whitelist').on( 'click', '.ip-add', function() {
		jetpackProtectDisableButtons();
		var data = jetppackProtectPreparePostData( jQuery( "#editable-whitelist" ).serializeArray() );
		var newIP = {
			ipAddress : '',
			rangeLow : '',
			rangeHigh : ''
		};

		if(jetpackProtect.range) {
			newIP.rangeHigh = jQuery('#ip-input-range-high').val();
			newIP.rangeLow = jQuery('#ip-input-range-low').val();
		} else {
			newIP.ipAddress = jQuery('#ip-input-single').val();
		}

		jQuery.post( ajaxurl, data, function( response ) {
			jetpackProtectEnableButtons();
			if( response ) {
				jetpackProtectAddIP( newIP );
			} else {
				alert( 'You entered an invalid IP Address' );
			}
		}, 'json');
	} );

}

function jetpackProtectAddIP( IP ) {
	var html_template = 'whitelist-static-single';
	if( jetpackProtect.range ) {
		html_template = 'whitelist-static-range';
		jQuery('#ip-input-range-low').val('');
		jQuery('#ip-input-range-high').val('');
	} else {
		jQuery('#ip-input-single').val('');
	}
	var row = _.template(
		jQuery('script.' + html_template ).html()
	);
	IP.key = 'new' + jetpackProtect.newIPKey;
	jQuery( '.editable-whitelist-rows').append( row( IP ) );
	jetpackProtect.newIPKey++;
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