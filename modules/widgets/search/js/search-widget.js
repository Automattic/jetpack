jQuery( document ).ready( function() {
	var filter_list = jQuery( '.jetpack-search-filters-widget__filter-list' );

	filter_list.on( 'click', 'a', function() {
		var checkbox = jQuery( this ).children( 'input[type="checkbox"]' );

		toggle_checkbox( checkbox );
	} );

	filter_list.find( 'input[type="checkbox"]' ).prop( 'disabled', false ).css( 'cursor', 'inherit' ).on( 'click', function() {
		toggle_checkbox( jQuery( this ) );
	} );

	function toggle_checkbox( checkbox ) {
		checkbox.prop( 'checked', ! checkbox.prop( 'checked' ) );
	}
} );
