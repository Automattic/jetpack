/**
 * Adds functionality for Related Posts controls in Customizer.
 */


wp.customize( 'jetpack_relatedposts[show_headline]', function( setting ) {

	var setupControl = function( control ) {

		var setActiveState, isDisplayed;

		isDisplayed = function() {
			return setting.get();
		};

		setActiveState = function() {
			control.active.set( isDisplayed() );
		};

		control.active.validate = isDisplayed;

		setActiveState();

		setting.bind( setActiveState );
	};

	wp.customize.control( 'jetpack_relatedposts[headline]', setupControl );
} );