<?php
/**
 * Beaverbuilder Compatibility.
 */
class BeaverBuilderCompat {

	function __construct() {
		add_action( 'init', array( $this, 'masterbar_refresh' ) );
	}

	/**
	 * If masterbar module is active force BeaverBuilder to refresh when publishing a layout.
	 */
	function masterbar_refresh() {
		if ( Jetpack::is_module_active( 'masterbar' ) ) {
			add_filter( 'fl_builder_should_refresh_on_publish', '__return_true' );
		}
	}
}
new BeaverBuilderCompat();
