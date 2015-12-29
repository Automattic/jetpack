/* global wp, jQuery */
jQuery( function() {
	module( 'gallery-settings' );

	wp.media.gallery = wp.media.gallery || {};
	wp.media.gallery.defaults = wp.media.gallery.defaults || {};

	test( 'should wrap the render method', function( assert ) {
		var settings = new wp.media.view.Settings.Gallery(),
			parentMock = this.mock( wp.media.view.Settings.prototype ),
			templateMock = this.mock( wp.media );

		assert.expect( 4 );

		parentMock.expects( 'render' );
		templateMock
			.expects( 'template' )
			.withArgs( 'jetpack-gallery-settings' )
			.returns( jQuery( '<span />' ) );

		settings.render();

		parentMock.verify();
		templateMock.verify();
	});

});
