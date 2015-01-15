var whitelist_item_index = 0;

function protectInit() {

	// remove an ip address from the table
	jQuery( "#editable-whitelist").on( "click", ".delete-ip-address", function() {
		var id = jQuery( this).data( "id" );
		jQuery("#editable-whitelist #row-" + id).detach();
		activateSaveButton();
	});

	jQuery( ".ip-add" ).click( function() {
		var template = jQuery( this).data( "template" );
		var row = _.template(
			jQuery("script." + template ).html()
		);
		jQuery( ".editable-whitelist-rows").append( row( { id : "new" + whitelist_item_index } ) );
		whitelist_item_index++;
		activateSaveButton();
	});
}

function activateSaveButton() {
	jQuery( "#whitelist-save-button" ).removeAttr( "disabled" );
}