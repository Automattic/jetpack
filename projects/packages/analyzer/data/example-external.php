<?php
/**
 * This file is not meant to be run. It is used as example input to the compatibility checker script.
 *
 * @package automattic/jetpack-analyzer
 */

// phpcs:disable

// valid signature initialization with missing class.
$sig = new Jetpack_Signature( 'abcd1234', 12345 );

// static method.
Jetpack_Tracks_Client::record_event( array( '_en' => 'jetpack_sample_event' ) );

// assignment from static prop.
$product_name = \JetpackTracking::$product_name;

// assignment to static prop.
\Jetpack_Sync_Defaults::$default_options_whitelist = array( 'a', 'b', 'c' );

// use removed function.
$id = jetpack_shortcode_get_videopress_id( array( 'foo' => 'bar' ) ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
