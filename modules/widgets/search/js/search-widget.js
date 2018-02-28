jQuery( document ).ready( function() {
	var checkboxes = jQuery( '.jetpack-search-filters-widget__filter-list input[type="checkbox"]' );

	checkboxes.prop( 'disabled', false ).css( 'cursor', 'inherit' );
	checkboxes.on( 'click change', function( e ) {
		var anchor;
		e.preventDefault();

		anchor = jQuery( this ).closest( 'a' );
		if ( anchor.length ) {
			window.location.href = anchor.prop( 'href' );
		}
	} );
} );
