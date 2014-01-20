
this.jetpackModules = this.jetpackModules || {};

window.jetpackModules.views = (function( window, $, _, Backbone ) {
		'use strict';

		var views = {};

		views.List_Table = Backbone.View.extend({

			template : _.template( $('#Jetpack_Modules_List_Table_Template').html() ),

			render : function() {
				this.model.filter_and_sort();
				this.$el.html( this.template( this.model.attributes ) );
				return this;
			},

			initialize : function( options ) {
				this.listenTo( this.model, 'change', this.render );
			}

		});

		return views;

})( this, jQuery, _, Backbone );
