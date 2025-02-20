<?php

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\Schema\Schema_Parser;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Readonly;
use Automattic\Jetpack_Boost\Data_Sync\Getting_Started_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Mergeable_Array_Entry;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\My_Jetpack;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Premium_Pricing;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}

/**
 * Make it easier to register a Jetpack Boost Data-Sync option.
 *
 * @param string                                                           $key - The key for this option.
 * @param \Automattic\Jetpack\Schema\Parser                                $parser - The schema for this option.
 * @param \Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get|null $entry - The entry handler for this option.
 */
function jetpack_boost_register_option( $key, $parser, $entry = null ) {
	Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
			->register( $key, $parser, $entry );
}

/**
 * Register a new Jetpack Boost Data_Sync Action
 *
 * @param string           $key
 * @param string           $action_name
 * @param Schema_Parser    $request_schema
 * @param Data_Sync_Action $instance
 *
 * @return void
 */
function jetpack_boost_register_action( $key, $action_name, $request_schema, $instance ) {
	Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
			->register_action( $key, $action_name, $request_schema, $instance );
}

/**
 * Make it easier to register a Jetpack Boost Read-only Data-Sync option.
 */
function jetpack_boost_register_readonly_option( $key, $callback ) {
	jetpack_boost_register_option( $key, Schema::as_unsafe_any(), new Data_Sync_Readonly( $callback ) );
}

/**
 * @param string $key
 *
 * @return Data_Sync_Entry
 */
function jetpack_boost_ds_entry( $key ) {
	return Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
					->get_registry()
					->get_entry( $key );
}

function jetpack_boost_ds_get( $key ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->get();
}

function jetpack_boost_ds_set( $key, $value ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->set( $value );
}

function jetpack_boost_ds_delete( $key ) {
	$entry = jetpack_boost_ds_entry( $key );
	if ( ! $entry ) {
		return null;
	}
	return $entry->delete();
}

/**
 * Ensure that Async Options are passed to the relevant scripts.
 */
function jetpack_boost_initialize_datasync() {
	$data_sync = Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE );
	$data_sync->attach_to_plugin( 'jetpack-boost-admin', 'jetpack_page_jetpack-boost' );
}

add_action( 'admin_init', 'jetpack_boost_initialize_datasync' );

/**
 * Entry to store alerts that shouldn't be shown again.
 */
jetpack_boost_register_option(
	'dismissed_alerts',
	Schema::as_assoc_array(
		array(
			'legacy_minify_notice'            => Schema::as_boolean(),
			'performance_history_fresh_start' => Schema::as_boolean(),
			'score_increase'                  => Schema::as_boolean(),
			'score_decrease'                  => Schema::as_boolean(),
		)
	)->fallback(
		array(
			'legacy_minify_notice'            => false,
			'performance_history_fresh_start' => false,
			'score_increase'                  => false,
			'score_decrease'                  => false,
		)
	),
	new Mergeable_Array_Entry( JETPACK_BOOST_DATASYNC_NAMESPACE . '_dismissed_alerts' )
);

jetpack_boost_register_readonly_option( 'connection', array( new Connection(), 'get_connection_api_response' ) );
jetpack_boost_register_readonly_option( 'pricing', array( Premium_Pricing::class, 'get_yearly_pricing' ) );
jetpack_boost_register_readonly_option( 'product', array( My_Jetpack::class, 'get_product' ) );
jetpack_boost_register_readonly_option( 'premium_features', array( Premium_Features::class, 'get_features' ) );

jetpack_boost_register_option( 'getting_started', Schema::as_boolean()->fallback( false ), new Getting_Started_Entry() );
