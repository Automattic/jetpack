<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}
/**
 * Make it easier to register a Jetpack Boost Data-Sync option.
 *
 * @param $key    string - The key for this option.
 * @param $schema Schema - The schema for this option.
 * @param $entry  Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry_Adapter|null - The entry handler for this option.
 */
function jetpack_boost_register_option( $key, $schema, $entry = null ) {
	Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
			->register( $key, $schema, $entry );
}

/**
 * @param $key
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

$critical_css_state_schema = Schema::as_assoc_array(
	array(
		'callback_passthrough' => Schema::any_json_data()->nullable(),
		'generation_nonce'     => Schema::as_string()->nullable(),
		'proxy_nonce'          => Schema::as_string()->nullable(),
		'providers'            => Schema::as_array(
			Schema::as_assoc_array(
				array(
					'key'           => Schema::as_string(),
					'label'         => Schema::as_string(),
					'urls'          => Schema::as_array( Schema::as_string() ),
					'success_ratio' => Schema::as_float(),
					'status'        => Schema::enum( array( 'success', 'pending', 'error', 'validation-error' ) )->fallback( 'validation-error' ),
					'error_status'  => Schema::enum( array( 'active', 'dismissed' ) )->nullable(),
					'errors'        => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'url'     => Schema::as_string(),
								'message' => Schema::as_string(),
								'type'    => Schema::as_string(),
								'meta'    => Schema::any_json_data()->nullable(),
							)
						)->fallback( array() )
					)->nullable(),
				)
			)
		)->nullable(),
		'status'               => Schema::enum( array( 'not_generated', 'generated', 'pending', 'error' ) )->fallback( 'not_generated' ),
		'updated'              => Schema::as_float()->nullable(),
		'status_error'         => Schema::as_string()->nullable(),
		'created'              => Schema::as_float()->nullable(),
		'viewports'            => Schema::as_array(
			Schema::as_assoc_array(
				array(
					'type'   => Schema::as_string(),
					'width'  => Schema::as_number(),
					'height' => Schema::as_number(),
				)
			)
		)->fallback( array() ),
	)
)->fallback(
	array(
		'status'               => 'not_generated',
		'providers'            => array(),
		'callback_passthrough' => null,
		'generation_nonce'     => null,
		'proxy_nonce'          => null,
		'viewports'            => array(),
		'created'              => null,
		'updated'              => null,
	)
);

/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_state', $critical_css_state_schema );
jetpack_boost_register_option( 'critical_css_suggest_regenerate', Schema::as_boolean()->fallback( false ) );

$modules_state_schema = Schema::as_array(
	Schema::as_assoc_array(
		array(
			'active'    => Schema::as_boolean()->fallback( false ),
			'available' => Schema::as_boolean()->nullable(),
		)
	)
)->fallback( array() );

$entry = new Modules_State_Entry();
jetpack_boost_register_option( 'modules_state', $modules_state_schema, $entry );
