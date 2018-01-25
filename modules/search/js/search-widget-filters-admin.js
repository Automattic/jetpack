/* globals jetpack_search_filter_admin, jQuery, analytics */

( function( $, args ) {
	var defaultFilterCount = ( 'undefined' !== typeof args && args.defaultFilterCount ) ?
		args.defaultFilterCount :
		5; // Just in case we couldn't find the defaultFiltercount arg

	$( document ).ready( function() {
		setListeners();

		// Initialize Tracks
		if ( 'undefined' !== typeof analytics && args.tracksUserData ) {
			analytics.initialize( args.tracksUserData.userid, args.tracksUserData.username );
		}
	} );

	var setListeners = function( widget ) {
		widget = ( 'undefined' === typeof widget ) ?
			$( '.jetpack-search-filters-widget' ):
			widget;

		widget.on( 'change', '.filter-select', function() {
			var select = $( this ),
				selectVal = select.val(),
				eventArgs = {
					is_customizer: args.tracksEventData.is_customizer
				};

			eventArgs.type = selectVal;

			select
				.closest( '.jetpack-search-filters-widget__filter' )
				.attr( 'class', 'jetpack-search-filters-widget__filter' )
				.addClass( 'is-' + selectVal );

			trackAndBumpMCStats( 'changed_filter_type', eventArgs );
		} );

		// enable showing sort controls only if showing search box is enabled
		widget.on( 'change', '.jetpack-search-filters-widget__search-box-enabled', function() {
			var checkbox = $( this ),
				checkboxVal = checkbox.is(':checked'),
				filterParent = checkbox.closest( '.jetpack-search-filters-widget' ),
				sortControl = filterParent.find( '.jetpack-search-filters-widget__sort-controls-enabled' );

			filterParent.toggleClass( 'hide-post-types' );

			if ( checkboxVal ) {
				sortControl.removeAttr( 'disabled' );
				trackAndBumpMCStats( 'enabled_search_box', args.tracksEventData );
			} else {
				sortControl.prop( 'checked', false );
				sortControl.prop( 'disabled', true );
				trackAndBumpMCStats( 'disabled_search_box', args.tracksEventData );
			}
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__sort-controls-enabled', function() {
			if ( $( this ).is( ':checked' ) ) {
				trackAndBumpMCStats( 'enabled_sort_controls', args.tracksEventData );
			} else {
				trackAndBumpMCStats( 'disabled_sort_controls', args.tracksEventData );
			}
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__post-types-select input[type="checkbox"]', function() {
			var t = $( this );
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer,
				post_type:  t.val()
			};

			if ( t.is( ':checked' ) ) {
				trackAndBumpMCStats( 'added_post_type', eventArgs );
			} else {
				trackAndBumpMCStats( 'removed_post_type', eventArgs );
			}
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__sort-order', function() {
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer
			};

			eventArgs.order = $( this ).val();

			trackAndBumpMCStats( 'changed_sort_order', eventArgs );
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__taxonomy-select select', function() {
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer
			};

			eventArgs.taxonomy = $( this ).val();

			trackAndBumpMCStats( 'changed_taxonomy', eventArgs );
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__date-histogram-select:first select', function() {
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer
			};

			eventArgs.field = $( this ).val();

			trackAndBumpMCStats( 'changed_date_field', eventArgs );
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__date-histogram-select:eq(1) select', function() {
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer
			};

			eventArgs.interval = $( this ).val();

			trackAndBumpMCStats( 'changed_date_interval', eventArgs );
		} );

		widget.on( 'change', '.filter-count', function() {
			var eventArgs = {
				is_customizer: args.tracksEventData.is_customizer
			};

			eventArgs.count = $( this ).val();

			trackAndBumpMCStats( 'changed_filter_count', eventArgs );
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

			trackAndBumpMCStats( 'added_filter', args.tracksEventData );
		} );

		widget.on( 'click', '.jetpack-search-filters-widget__controls .delete', function( e ) {
			e.preventDefault();
			var filter = $( this ).closest( '.jetpack-search-filters-widget__filter' ),
				eventArgs = {
					is_customizer: args.tracksEventData.is_customizer
				};

			eventArgs.type = filter.find( '.filter-select' ).val();

			switch ( eventArgs.type ) {
				case 'taxonomy':
					eventArgs.taxonomy = filter.find( '.jetpack-search-filters-widget__taxonomy-select select' ).val();
					break;
				case 'date_histogram':
					eventArgs.dateField = filter.find( '.jetpack-search-filters-widget__date-histogram-select:first select' ).val();
					eventArgs.dateInterval = filter.find( '.jetpack-search-filters-widget__date-histogram-select:nth-child( 2 ) select' ).val();
					break;
			}

			eventArgs.filterCount = filter.find( '.filter-count' ).val();

			trackAndBumpMCStats( 'deleted_filter', eventArgs );

			filter.find( 'input, textarea, select' ).change();
			filter.remove();
		} );

		widget.on( 'change', '.jetpack-search-filters-widget__use-filters', function() {
			var selector = $( this ).closest( '.jetpack-search-filters-widget' );

			if ( $( this ).is(':checked') ) {
				trackAndBumpMCStats( 'enabled_filters', args.tracksEventData );
			} else {
				trackAndBumpMCStats( 'disabled_filters', args.tracksEventData );
			}

			selector.toggleClass( 'hide-filters' );
		} );
	};

	// When widgets are updated, remove and re-add listeners
	$( document ).on( 'widget-updated widget-added', function( e, widget ) {
		widget = $( widget );

		var id = widget.attr( 'id' ),
			isJetpackSearch = ( id && ( -1 !== id.indexOf( 'jetpack-search-filters' ) ) );

		if ( ! isJetpackSearch ) {
			 return;
		}

		// Intentionally not tracking widget additions and updates here as these events
		// seem noisy in the customizer. We'll track those via PHP.

		widget.off( 'change', '.filter-select' );
		widget.off( 'click', '.jetpack-search-filters-widget__controls .add' );
		widget.off( 'click', '.jetpack-search-filters-widget__controls .delete' );
		widget.off( 'change', '.jetpack-search-filters-widget__use-filters' );
		widget.off( 'change', '.jetpack-search-filters-widget__search-box-enabled' );
		widget.off( 'change', '.jetpack-search-filters-widget__sort-controls-enabled' );
		widget.off( 'change', '.jetpack-search-filters-widget__sort-controls-enabled' );
		widget.off( 'change', '.jetpack-search-filters-widget__post-type-selector' );
		widget.off( 'change', '.jetpack-search-filters-widget__sort-order' );
		widget.off( 'change', '.jetpack-search-filters-widget__taxonomy-select' );
		widget.off( 'change', '.jetpack-search-filters-widget__date-histogram-select:first select' );
		widget.off( 'change', '.jetpack-search-filters-widget__date-histogram-select:eq(1) select' );

		setListeners( widget );
	} );

	/**
	 * This function will fire both a Tracks and MC stat.
	 *
	 * Tracks: Will be prefixed by 'jetpack_widget_search_' and use underscores.
	 * MC: Will not be prefixed, and will use dashes.
	 *
	 * Logic borrowed from `idc-notice.js`.
	 *
	 * @param eventName string
	 * @param extraProps object
	 */
	function trackAndBumpMCStats( eventName, extraProps ) {
		if ( 'undefined' === typeof extraProps || 'object' !== typeof extraProps ) {
			extraProps = {};
		}

		if ( eventName && eventName.length && 'undefined' !== typeof analytics && analytics.tracks && analytics.mc ) {
			// Format for Tracks
			eventName = eventName.replace( /-/g, '_' );
			eventName = eventName.indexOf( 'jetpack_widget_search_' ) !== 0 ? 'jetpack_widget_search_' + eventName : eventName;
			analytics.tracks.recordEvent( eventName, extraProps );

			// Now format for MC stats
			eventName = eventName.replace( 'jetpack_widget_search_', '' );
			eventName = eventName.replace( /_/g, '-' );
			analytics.mc.bumpStat( 'jetpack-search-widget', eventName );
		}
	}
} )( jQuery, jetpack_search_filter_admin );
