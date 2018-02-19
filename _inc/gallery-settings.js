/**
 * Jetpack Gallery Settings
 */
(function($) {
	var media = wp.media;

	// Wrap the render() function to append controls.
	// If there's some other code extending the Gallery render, let's use that...
	// Otherwise, just extend the basic Settings render
	var oldRender = media.view.Settings.Gallery.prototype.render ?
		media.view.Settings.Gallery.prototype.render :
		media.view.Settings.prototype.render;
	media.view.Settings.Gallery = media.view.Settings.Gallery.extend({
		render: function() {
			var $el = this.$el;

			oldRender.apply( this, arguments );

			// Append the type template and update the settings.
			$el.append( media.template( 'jetpack-gallery-settings' ) );
			media.gallery.defaults.type = 'default'; // lil hack that lets media know there's a type attribute.
			this.update.apply( this, ['type'] );

			// Hide the Columns setting for all types except Default
			$el.find( 'select[name=type]' ).on( 'change', function () {
				var columnSetting = $el.find( 'select[name=columns]' ).closest( 'label.setting' );

				if ( 'default' === $( this ).val() || 'thumbnails' === $( this ).val() ) {
					columnSetting.show();
				} else {
					columnSetting.hide();
				}
			} ).change();

			return this;
		}
	});
})(jQuery);
