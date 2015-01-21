var whitelist_item_index = 0;

jQuery(document).ready( function() {
	protectInit();
});

function protectInit() {

	// remove an ip address from the table
	jQuery( '#editable-whitelist' ).on( 'click', '.delete-ip-address', function() {
		var id = jQuery( this ).data( 'id' );
		delete_ip_row( id );
	});

	jQuery( '#editable-whitelist' ).on( 'click', '.ip-range-button', function() {
		var id = jQuery( this ).data( 'id' );
		delete_ip_row( id );
		add_ip_row( 'whitelist-item-template-range' );
	});

	jQuery( '.ip-add' ).click( function() {
		add_ip_row( 'whitelist-item-template-single' );
	});
}

function add_ip_row( html_template ) {
	var row = _.template(
		jQuery('script.' + html_template ).html()
	);
	jQuery( '.editable-whitelist-rows').append( row( { id : 'new' + whitelist_item_index } ) );
	whitelist_item_index++;
	activateSaveButton();
}

function delete_ip_row( id ) {
	jQuery( '#editable-whitelist #row-' + id ).detach();
	activateSaveButton();
}

function activateSaveButton() {
	jQuery( '#whitelist-save-button' ).removeAttr( 'disabled').addClass('savable');
}