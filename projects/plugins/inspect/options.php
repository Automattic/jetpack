<?php

use Automattic\Jetpack\Packages\Async_Option\Async_Option;
use Automattic\Jetpack\Packages\Async_Option\Async_Options;
use Automattic\Jetpack\Packages\Async_Option\Registry;
use Automattic\Jetpack_Inspect\Options\Monitor_Status;
use Automattic\Jetpack_Inspect\Options\Observer_Settings;

/**
 * Functions to make it easier to interface with Async Option:
 */
function jetpack_inspect_register_option( $name, $handler ) {
	return Registry::get_instance( 'jetpack_inspect' )
					->register( $name, $handler );
}

/**
 * @param $name
 *
 * @return Async_Option
 */
function jetpack_inspect_option( $name ) {
	return Registry::get_instance( 'jetpack_inspect' )->get_option( $name );
}

function jetpack_inspect_get_option( $option ) {
	return jetpack_inspect_option( $option )->get();
}

function jetpack_inspect_update_option( $option, $value ) {
	return jetpack_inspect_option( $option )->set( $value );
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
add_action(
	'admin_init',
	function () {
		Async_Options::setup( 'jetpack_inspect', 'jetpack-inspect-main' );
	}
);

jetpack_inspect_register_option( 'monitor_status', new Monitor_Status() );
jetpack_inspect_register_option( 'observer_incoming', new Observer_Settings() );
jetpack_inspect_register_option( 'observer_outgoing', new Observer_Settings() );

