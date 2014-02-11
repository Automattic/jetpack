
this.jetpackModules = this.jetpackModules || {};

window.jetpackModules.models = (function( window, $, _, Backbone ) {
		'use strict';

		var models = {};

		models.Modules = Backbone.Model.extend({
			visibles : {},

			/**
			* Updates modules.items dataset to be a reflection of both the current
			* modules.raw data, as well as any filters or sorting that may be in effect.
			*/
			filter_and_sort : function() {
				var subsubsub = $('.subsubsub .current'),
					items     = this.get( 'raw' ),
					m_filter  = $('.button-group.filter-active .active'),
					m_sort    = $('.button-group.sort .active');

				// If a module filter has been selected, filter it!
				if ( ! subsubsub.closest('li').hasClass( 'all' ) ) {
					items = _.filter( items, function( item ) {
						return _.contains( item.module_tags, subsubsub.data( 'title' ) );
					} );
				}

				if ( m_filter.data('filter-by') ) {
					items = _.filter( items, function( item ) {
						return item[ m_filter.data('filter-by') ] == m_filter.data('filter-value');
					} );
				}

				if ( m_sort.data('sort-by') ) {

				}

				// Now shove it back in.
				this.set( 'items', items );

				return this;
			},

			initialize : function() {
				this.set( 'raw', this.get( 'items' ) );
			}

		});

		return models;

})( this, jQuery, _, Backbone );
