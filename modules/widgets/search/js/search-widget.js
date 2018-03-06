jQuery( document ).ready( function() {
	var filter_list = jQuery( '.jetpack-search-filters-widget__filter-list' );

	filter_list.on( 'click', 'a', function() {
		var checkbox = jQuery( this ).siblings( 'input[type="checkbox"]' );
		checkbox.prop( 'checked', ! checkbox.prop( 'checked' ) );
	} );

	filter_list.find( 'input[type="checkbox"]' ).prop( 'disabled', false ).css( 'cursor', 'inherit' ).on( 'click', function() {
		var anchor = jQuery( this ).siblings( 'a' );
		if ( anchor.length ) {
			window.location.href = anchor.prop( 'href' );
		}
	} );
} );
