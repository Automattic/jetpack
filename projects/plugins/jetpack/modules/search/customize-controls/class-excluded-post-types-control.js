/* eslint-disable no-var */

jQuery( document ).ready( function( $ ) {
	// Refresh our hidden field value if any checkboxes change
	$( '.customize-control-excluded-post-type-checkbox' ).on( 'change', function() {
		var $parent = $( this )
			.parent()
			.parent();
		var newValue = $parent
			.find( '.customize-control-excluded-post-type-checkbox:checked' )
			.map( function() {
				return $( this ).val();
			} )
			.toArray();
		$parent
			.find( '.customize-control-excluded-post-types' )
			.val( newValue )
			.trigger( 'change' );
	} );
} );
