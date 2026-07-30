window.jetpackModules = window.jetpackModules || {};

window.jetpackModules.models = ( function ( window, $, Backbone ) {
	'use strict';

	var models = {};

	models.Modules = Backbone.Model.extend( {
		visibles: {},

		/**
		 * Updates modules.items dataset to be a reflection of both the current
		 * modules.raw data, as well as any filters or sorting that may be in effect.
		 */
		filter_and_sort: function () {
			var subsubsub = $( '.subsubsub .current a' ),
				items = Object.values( this.get( 'raw' ) ),
				m_filter = $( '.button-group.filter-active .active' ),
				m_availability = $( '.button-group.availability-filter .active' ),
				m_sort = $( '.button-group.sort .active' ),
				m_search = $( '#srch-term-search-input' ).val().toLowerCase();

			// Offline-mode top-level filter: when "Hide unavailable" is selected,
			// drop every module that isn't available offline, regardless of the
			// other filters below it.
			if ( 'hide-unavailable' === m_availability.data( 'availability' ) ) {
				items = items.filter( item => item.available );
			}

			// If a module filter has been selected, filter it!
			if ( ! subsubsub.closest( 'li' ).hasClass( 'all' ) ) {
				items = items.filter( item => item.module_tags.includes( subsubsub.data( 'title' ) ) );
			}

			if ( m_filter.data( 'filter-by' ) ) {
				items = items.filter(
					item => item[ m_filter.data( 'filter-by' ) ] === m_filter.data( 'filter-value' )
				);
			}

			if ( m_search.length ) {
				items = items.filter( function ( item ) {
					var search_text =
						item.name +
						' ' +
						item.description +
						' ' +
						item.long_description +
						' ' +
						item.search_terms +
						' ' +
						item.module_tags;
					return -1 !== search_text.toLowerCase().indexOf( m_search );
				} );
			}

			if ( m_sort.data( 'sort-by' ) ) {
				const key = m_sort.data( 'sort-by' );
				const cmpret = 'reverse' === m_sort.data( 'sort-order' ) ? -1 : 1;

				items.sort( ( a, b ) =>
					// eslint-disable-next-line no-nested-ternary
					a[ key ] > b[ key ] ? cmpret : a[ key ] < b[ key ] ? -cmpret : 0
				);
			}

			// Group by product group (primary), then push unavailable modules to
			// the end of their group. Any user-selected sort above is preserved
			// within a group because Array.prototype.sort is stable in the
			// browsers we support.
			var groupOrder = { growth: 0, performance: 1, security: 2, other: 3 };
			items.sort( function ( a, b ) {
				var ga = groupOrder[ a.product_group ] !== undefined ? groupOrder[ a.product_group ] : 99;
				var gb = groupOrder[ b.product_group ] !== undefined ? groupOrder[ b.product_group ] : 99;

				if ( ga !== gb ) {
					return ga - gb;
				}

				return ( b.available ? 1 : 0 ) - ( a.available ? 1 : 0 );
			} );

			// Now shove it back in.
			this.set( 'items', items );

			return this;
		},

		initialize: function () {
			var items = this.get( 'items' );
			this.set( 'raw', items );
		},
	} );

	return models;
} )( window, jQuery, Backbone );
