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
				m_sort = $( '.button-group.sort .active' ),
				m_search = $( '#srch-term-search-input' ).val().toLowerCase();

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

			// Sort unavailable modules to the end if the user is running in local mode.
			// JS sort is supposed to be stable since 2019, and is in browsers we care about, so this is safe.
			items.sort( ( a, b ) => b.available - a.available );

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
