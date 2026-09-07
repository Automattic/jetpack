window.jetpackModules = window.jetpackModules || {};

window.jetpackModules.views = ( function ( window, $, Backbone, wp ) {
	'use strict';

	var views = {};

	views.List_Table = Backbone.View.extend( {
		template: wp.template( 'Jetpack_Modules_List_Table_Template' ),

		/**
		 * If we can, use replaceState to change the URL and indicate the new filtering.
		 * This will be handy with redirecting back to the same state after activating/deactivating.
		 */
		updateUrl: function () {
			if ( ! window.history.replaceState ) {
				return;
			}

			var url = window.location.href.split( '?' )[ 0 ] + '?page=jetpack_modules',
				m_tag = $( '.subsubsub .current' ),
				m_purpose = $( '.purpose-filter .current' ),
				m_availability = $( '.button-group.availability-filter .active' ),
				m_search = $( '#srch-term-search-input' ).val();

			if ( m_search.length ) {
				url += '&s=' + encodeURIComponent( m_search );
			}

			// "Hide unavailable" is the default in Offline Mode, so only the opt-out
			// ("All") needs to be persisted in the URL.
			if ( 'all' === m_availability.data( 'availability' ) ) {
				url += '&offline_available=all';
			}

			if ( ! m_tag.hasClass( 'all' ) ) {
				url += '&module_tag=' + encodeURIComponent( m_tag.find( 'a' ).data( 'title' ) );
			}

			if ( m_purpose.length && ! m_purpose.hasClass( 'all' ) ) {
				url += '&product_group=' + encodeURIComponent( m_purpose.find( 'a' ).data( 'group' ) );
			}

			// State facet (segmented buttons). "All" carries no data-filter-by.
			$( '.button-group.module-filter .active' ).each( function () {
				var by = $( this ).data( 'filter-by' ),
					value = $( this ).data( 'filter-value' );

				if ( by ) {
					url += '&' + encodeURIComponent( by ) + '=' + encodeURIComponent( value );
				}
			} );

			window.history.replaceState( {}, '', url );
		},

		/**
		 * Writes faceted counts into a facet list (the tag list or the Purpose
		 * list), and greys out entries that have no matches under the current
		 * filters. The "All" entry always shows the total and is never disabled.
		 *
		 * @param {string} selector Facet list selector (e.g. '.subsubsub').
		 * @param {Object} counts   Map of key to count, plus `__all__`.
		 * @param {string} dataKey  data-* attribute on each link holding its key.
		 */
		updateFacetCounts: function ( selector, counts, dataKey ) {
			$( selector + ' > li' ).each( function () {
				var $li = $( this ),
					isAll = $li.hasClass( 'all' ),
					key = $li.children( 'a' ).data( dataKey ),
					n = isAll ? counts.__all__ : counts[ key ] || 0;

				$li.find( '.count' ).text( '(' + n + ')' );

				if ( ! isAll ) {
					$li.toggleClass( 'is-empty', 0 === n );
				}
			} );
		},

		/**
		 * Refreshes both facet lists ("Show" tags and "Purpose") so their counts
		 * reflect the currently-active filters.
		 */
		updateCounts: function () {
			this.updateFacetCounts( '.subsubsub', this.model.tag_counts(), 'title' );
			this.updateFacetCounts( '.purpose-filter', this.model.purpose_counts(), 'group' );
		},

		render: function () {
			this.model.filter_and_sort();
			this.$el.html( this.template( this.model.attributes ) );
			this.updateCounts();
			this.updateUrl();
			return this;
		},

		initialize: function () {
			this.listenTo( this.model, 'change', this.render );
		},
	} );

	return views;
} )( window, jQuery, Backbone, wp );
