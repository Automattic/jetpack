<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Boolean_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Registry;
use Automattic\Jetpack_Boost\Data_Sync\Cloud_CSS_Sync;
use Automattic\Jetpack_Boost\Data_Sync\Critical_CSS_State_Handler;
use Automattic\Jetpack_Boost\Data_Sync\Read_Only\Available_Modules;
use Automattic\Jetpack_Boost\Data_Sync\Read_Only\Entry_Handler as Read_Only_Entry_Handler;
use Automattic\Jetpack_Boost\Lib\Status;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}
/**
 * Functions to make it easier to interface with Data Sync:
 */
function jetpack_boost_register_option( $name, $handler ) {
	return Registry::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
					->register( $name, $handler );
}
/**
 * Functions to make it easier to interface with Data Sync based config:
 */
function jetpack_boost_register_read_only( $name, $source ) {
	return Registry::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
					->register( $name, Read_Only_Entry_Handler::class, $source );
}

/**
 * @param $name
 *
 * @return Data_Sync_Entry
 */
function jetpack_boost_ds( $name ) {
	return Registry::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )->get_entry( $name );
}

function jetpack_boost_ds_get( $option ) {
	$option = jetpack_boost_ds( $option );
	if ( ! $option ) {
		return null;
	}
	return $option->get();
}

function jetpack_boost_ds_set( $option, $value ) {
	$option = jetpack_boost_ds( $option );
	if ( ! $option ) {
		return null;
	}
	return $option->set( $value );
}

function jetpack_boost_ds_delete( $option_name ) {
	$option = jetpack_boost_ds( $option_name );
	if ( ! $option ) {
		return null;
	}
	return $option->delete();
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
add_action(
	'admin_init',
	function () {
		$options = Data_Sync::setup( JETPACK_BOOST_DATASYNC_NAMESPACE, 'jetpack-boost-admin' );
		add_action( 'jetpack_page_jetpack-boost', array( $options, '_print_options_script_tag' ) );
	}
);

/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_state', Critical_CSS_State_Handler::class );
jetpack_boost_register_option( 'cloud_critical_css_state', Cloud_CSS_Sync::class );
jetpack_boost_register_option( 'critical_css_suggest_regenerate', Boolean_Entry::class );

/**
 * Register module status options for each feature.
 */
foreach ( Automattic\Jetpack_Boost\Modules\Modules::MODULES as $feature_class ) {
	jetpack_boost_register_option( ( new Status( $feature_class::get_slug() ) )->get_ds_entry_name(), Boolean_Entry::class );
}

jetpack_boost_register_read_only( 'available_modules', Available_Modules::class );
