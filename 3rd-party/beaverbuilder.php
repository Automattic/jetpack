<?php
/**
 * Beaver Builder.
 *
 * @package Jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Jetpack_BeaverBuilderCompat' ) ) {
	/**
	 * Beaverbuilder Compatibility.
	 */
	class Jetpack_BeaverBuilderCompat {

		/**
		 * Constructor.
		 */
		function __construct() {
			add_action( 'init', array( $this, 'beaverbuilder_refresh' ) );
		}

		/**
		 * If masterbar module is active force BeaverBuilder to refresh when publishing a layout.
		 */
		function beaverbuilder_refresh() {
			if ( Jetpack::is_module_active( 'masterbar' ) ) {
				add_filter( 'fl_builder_should_refresh_on_publish', '__return_true' );
			}
		}
	}
}
new Jetpack_BeaverBuilderCompat();
