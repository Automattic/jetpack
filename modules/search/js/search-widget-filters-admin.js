/* globals jetpack_search_filter_admin, jQuery */

( function( $, args ) {
	var defaultFilterCount = ( 'undefined' !== typeof args && args.defaultFilterCount ) ?
		args.defaultFilterCount :
		5; // Just in case we couldn't find the defaultFiltercount arg

	var setListeners = function() {
		var widget = $( '.jetpack-search-filters-widget' );

		widget.on( 'change', '.filter-select', function() {
			var select = $( this ),
				selectVal = select.val();

			select
				.closest( '.jetpack-search-filters-widget__filter' )
				.attr( 'class', 'jetpack-search-filters-widget__filter' )
				.addClass( 'is-' + selectVal );
		} );

		// enable showing sort controls only if showing search box is enabled
		widget.on( 'change', '.jetpack-search-filters-widget__search-box-enabled', function() {
			var checkbox = $( this ),
				checkboxVal = checkbox.is(':checked');

			var sortControl = checkbox.closest( '.jetpack-search-filters-widget' ).find( '.jetpack-search-filters-widget__sort-controls-enabled' );

			if ( checkboxVal ) {
				sortControl.removeAttr( 'disabled' );
			} else {
				sortControl.prop( 'checked', false );
				sortControl.prop( 'disabled', true );
			}
		} );

		widget.on( 'click', '.jetpack-search-filters-widget__controls .add', function( e ) {
			e.preventDefault();
			var closest = $( this ).closest( '.jetpack-search-filters-widget__filter' ),
				clone = closest
					.clone()
					.attr( 'class', 'jetpack-search-filters-widget__filter' );

			clone.find( 'input[type="number"]' ).val( defaultFilterCount );
			clone.find( 'input[type="text"]' ).val( '' );
			clone.find( 'select option:first-child' ).prop( 'selected', true );

			clone.insertAfter( closest );
			clone.find( 'input, textarea, select' ).change();
		} );

		widget.on( 'click', '.jetpack-search-filters-widget__controls .delete', function( e ) {
			e.preventDefault();
			var filter = $( this ).closest( '.jetpack-search-filters-widget__filter' );
			filter.find( 'input, textarea, select' ).change();
			filter.remove();
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__use-filters', function() {
			$( this ).closest( '.jetpack-search-filters-widget' ).toggleClass( 'hide-filters' );
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__search-box-enabled', function() {
			$( this ).closest( '.jetpack-search-filters-widget' ).toggleClass( 'hide-post-types' );
		} );
	};

	$( document ).ready( function() {
		setListeners();
	} );

	// When widgets are updated, remove and re-add listeners
	$( document ).on( 'widget-updated widget-added', function() {
		var widget = $( '.jetpack-search-filters-widget' );
		widget.off( 'change', '.filter-select' );
		widget.off( 'click', '.jetpack-search-filters-widget__controls .add' );
		widget.off( 'click', '.jetpack-search-filters-widget__controls .delete' );
		widget.off( 'change', '.jetpack-search-filters-widget__use-filters' );
		widget.off( 'change', '.jetpack-search-filters-widget__search-box-enabled' );
		setListeners();
	} );
} )( jQuery, jetpack_search_filter_admin );
