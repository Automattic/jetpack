<?php

use Automattic\Jetpack\Packages\Async_Option\Async_Option;
use Automattic\Jetpack\Packages\Async_Option\Async_Options;
use Automattic\Jetpack\Packages\Async_Option\Registry;

/**
 * Functions to make it easier to interface with Async Option:
 */
function jetpack_boost_register_option( $name, $handler ) {
	return Registry::get_instance( 'jetpack_boost' )
	               ->register( $name, $handler );
}

/**
 * @param $name
 *
 * @return Async_Option
 */
function jetpack_boost_option( $name ) {
	return Registry::get_instance( 'jetpack_boost' )->get_option( $name );
}

function jetpack_boost_get_option( $option ) {
	return jetpack_boost_option( $option )->get();
}

function jetpack_boost_update_option( $option, $value ) {
	return jetpack_boost_option( $option )->set( $value );
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
add_action( 'admin_init', function() {
	Async_Options::setup( 'jetpack_boost', 'jetpack-boost-admin' );
} );




