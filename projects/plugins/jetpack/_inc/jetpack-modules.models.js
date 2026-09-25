window.jetpackModules = window.jetpackModules || {};

window.jetpackModules.models = ( function ( window, $, Backbone ) {
	'use strict';

	var models = {};

	models.Modules = Backbone.Model.extend( {
		visibles: {},

		/**
		 * Applies the active availability, tag, state/purpose and search filters
		 * to the raw module set and returns the matching items (unsorted).
		 *
		 * @param {Object}  [options]               Filtering options.
		 * @param {boolean} [options.ignoreTag]     When true, skip the "Show" tag
		 *                                          facet so counts can be computed independently of the current tag
		 *                                          selection (faceted counting).
		 * @param {boolean} [options.ignorePurpose] When true, skip the "Purpose"
		 *                                          facet so its own faceted counts can be computed.
		 * @return {Array} Filtered module items.
		 */
		apply_filters: function ( options ) {
			options = options || {};

			var subsubsub = $( '.subsubsub .current a' ),
				purpose = $( '.purpose-filter .current a' ),
				items = Object.values( this.get( 'raw' ) ),
				m_availability = $( '.button-group.availability-filter .active' ),
				m_search = $( '#srch-term-search-input' ).val().toLowerCase();

			// Offline-mode top-level filter: when "Hide unavailable" is selected,
			// drop every module that isn't available offline, regardless of the
			// other filters below it.
			if ( 'hide-unavailable' === m_availability.data( 'availability' ) ) {
				items = items.filter( item => item.available );
			}

			// Tag facet ("Show"). Skipped when computing that facet's own counts.
			if ( ! options.ignoreTag && ! subsubsub.closest( 'li' ).hasClass( 'all' ) ) {
				items = items.filter( item => item.module_tags.includes( subsubsub.data( 'title' ) ) );
			}

			// Purpose facet. Skipped when computing that facet's own counts.
			if (
				! options.ignorePurpose &&
				purpose.length &&
				! purpose.closest( 'li' ).hasClass( 'all' )
			) {
				items = items.filter( item => item.product_group === purpose.data( 'group' ) );
			}

			// State facet (segmented buttons). "All" carries no data-filter-by.
			$( '.button-group.module-filter .active' ).each( function () {
				var by = $( this ).data( 'filter-by' ),
					value = $( this ).data( 'filter-value' );

				if ( by ) {
					items = items.filter( item => item[ by ] === value );
				}
			} );

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

			return items;
		},

		/**
		 * Computes, for the "Show" tag list, how many modules match every active
		 * filter except the tag facet itself. This powers faceted counts that
		 * stay meaningful as the user narrows the other filters.
		 *
		 * @return {Object} Map of translated tag title to count, plus an
		 *   `__all__` key holding the total across all tags.
		 */
		tag_counts: function () {
			var base = this.apply_filters( { ignoreTag: true } ),
				counts = { __all__: base.length };

			base.forEach( function ( item ) {
				( item.module_tags || [] ).forEach( function ( tag ) {
					counts[ tag ] = ( counts[ tag ] || 0 ) + 1;
				} );
			} );

			return counts;
		},

		/**
		 * Computes, for the "Purpose" list, how many modules fall in each product
		 * group under every active filter except the Purpose facet itself. Mirrors
		 * tag_counts() so the two facet lists behave identically.
		 *
		 * @return {Object} Map of product-group slug to count, plus an `__all__`
		 *   key holding the total across all groups.
		 */
		purpose_counts: function () {
			var base = this.apply_filters( { ignorePurpose: true } ),
				counts = { __all__: base.length };

			base.forEach( function ( item ) {
				if ( item.product_group ) {
					counts[ item.product_group ] = ( counts[ item.product_group ] || 0 ) + 1;
				}
			} );

			return counts;
		},

		/**
		 * Updates modules.items dataset to be a reflection of both the current
		 * modules.raw data, as well as any filters or sorting that may be in effect.
		 */
		filter_and_sort: function () {
			var items = this.apply_filters();

			// Default alphabetical order by name. The product-group sort below is
			// stable, so this ordering is preserved within each group.
			items.sort( ( a, b ) => a.name.localeCompare( b.name ) );

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
