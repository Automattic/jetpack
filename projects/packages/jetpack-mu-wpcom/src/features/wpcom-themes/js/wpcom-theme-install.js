/* global Backbone, jQuery, wp */
( function ( $ ) {
	const themes = wp.themes;

	/**
	 * Customize backbone router for theme subpage URL.
	 */
	themes.InstallerRouter = Backbone.Router.extend( {
		routes: {
			'themes.php?page=wpcom-install-theme&theme=:slug': 'preview',
			'themes.php?page=wpcom-install-theme&browse=:sort': 'sort',
			'themes.php?page=wpcom-install-theme&search=:query': 'search',
			'themes.php?page=wpcom-install-theme': 'sort',
		},

		baseUrl: function ( url ) {
			return 'themes.php?page=wpcom-install-theme&' + url.replace( /^[&?]/, '' );
		},

		themePath: '&theme=',
		browsePath: '&browse=',
		searchPath: '&search=',

		search: function ( query ) {
			$( '.wp-filter-search' ).val( query.replace( /\+/g, ' ' ) );
		},

		navigate: function ( url, state ) {
			const router = this;
			if ( Backbone.history._hasPushState ) {
				Backbone.Router.prototype.navigate.call( router, url, state );
			}
		},
	} );

	// Switch installTheme handler to a noop, to prevent AJAX install request.
	themes.view.Theme = themes.view.Theme.extend( {
		installTheme: function () {},
	} );
	themes.view.Preview = themes.view.Preview.extend( {
		installTheme: function () {},
	} );
} )( jQuery );
