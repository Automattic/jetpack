<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Registry;


if( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}
/**
 * Functions to make it easier to interface with Async Option:
 */
function jetpack_boost_register_option( $name, $handler ) {
	return Registry::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
	               ->register( $name, $handler );
}

/**
 * @param $name
 *
 * @return Data_Sync_Entry
 */
function jetpack_boost_ds( $name ) {
	return Registry::get_instance( 'jetpack_boost_ds' )->get_entry( $name );
}

function jetpack_boost_ds_get( $option ) {
	return jetpack_boost_ds( $option )->get();
}

function jetpack_boost_ds_set( $option, $value ) {
	return jetpack_boost_ds( $option )->set( $value );
}

function jetpack_boost_ds_delete( $option ) {
	return jetpack_boost_ds( $option )->delete();
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
add_action(
	'admin_init',
	function() {
		$options = Data_Sync::setup( JETPACK_BOOST_DATASYNC_NAMESPACE, 'jetpack-boost-admin' );
		add_action( 'jetpack_page_jetpack-boost', array( $options, '_print_options_script_tag' ) );
	}
);



/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_issues', new Critical_CSS_Issues() );
