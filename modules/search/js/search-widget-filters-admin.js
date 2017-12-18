( function( $ ) {
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

		widget.on( 'click', '.jetpack-search-filters-widget__controls .add', function( e ) {
			e.preventDefault();
			var closest = $( this ).closest( '.jetpack-search-filters-widget__filter' ),
				clone = closest
					.clone()
					.attr( 'class', 'jetpack-search-filters-widget__filter' );

			clone.find( 'input[type="number"]' ).val( 10 );
			clone.find( 'input[type="text"]' ).val( '' );
			clone.find( 'select option:first-child' ).attr( 'selected', 'selected' );

			clone.insertAfter( closest );
		} );

		widget.on( 'click', '.jetpack-search-filters-widget__controls .delete', function( e ) {
			e.preventDefault();
			$( this ).closest( '.jetpack-search-filters-widget__filter' ).remove();
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__use-filters', function() {
			$( this ).closest( '.jetpack-search-filters-widget' ).toggleClass( 'hide-filters' );
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
		setListeners();
	} );
} )( jQuery );
