<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing
/**
 * Simple Payments module loader.
 *
 * @package automattic/jetpack
 */

/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

Jetpack_Simple_Payments::get_instance();
