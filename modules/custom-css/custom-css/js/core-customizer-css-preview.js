// Originally based on https://raw.githubusercontent.com/xwp/wp-custom-scss-demo/master/custom-scss-demo-preview.js
/* globals console */
(function( api, $ ) {
	if ( api.settingPreviewHandlers ) {
		// No-op the custom_css preview handler since now handled by partial.
		api.settingPreviewHandlers.custom_css = function() {};
	} else {
		parent.console.warn( 'Missing core patch that adds support for settingPreviewHandlers' );
	}

	api.selectiveRefresh.partialConstructor.custom_css = api.selectiveRefresh.Partial.extend( {

		/**
		 * Refresh custom_css partial, using selective refresh if pre-processor and direct DOM manipulation if otherwise.
		 *
		 * @returns {jQuery.promise}
		 */
		refresh: function() {
			var partial = this,
				preprocessor = api( 'jetpack_custom_css[preprocessor]' ).get(),
				deferred, setting;

			// Sass or Less require Partial -- so ajax call to get it from PHP.
			if ( 'sass' === preprocessor ) {
				parent.console.log( 'sass' );
				return api.selectiveRefresh.Partial.prototype.refresh.call( partial );
			} else if ( 'less' === preprocessor ) {
				parent.console.log( 'less' );
				return api.selectiveRefresh.Partial.prototype.refresh.call( partial );
			} else {
				// No ajax, no partial refresh, just write what we got.
				deferred = new $.Deferred();
				setting = api( 'custom_css[' + api.settings.theme.stylesheet + ']' );
				_.each( partial.placements(), function( placement ) {
					placement.container.text( setting.get() );
				} );

				deferred.resolve();
				return deferred.promise();
			}
		},

		/**
		 * Prevent adding edit shortcuts to head.
		 */
		createEditShortcutForPlacement: function() {}

	} );

}( wp.customize, jQuery ));
