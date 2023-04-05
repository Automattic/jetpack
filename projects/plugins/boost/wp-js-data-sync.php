<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Option;
use Automattic\Jetpack\WP_JS_Data_Sync\Registry;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Lib\Status;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}
/**
 * Functions to make it easier to interface with Async Option:
 *
 * @throws Exception
 */
function jetpack_boost_register_option( $key, $schema, $entry = null ) {
	if ( ! $entry ) {
		$option_key = JETPACK_BOOST_DATASYNC_NAMESPACE . '_' . $key;
		$entry = new Data_Sync_Option( $option_key );
	}
	return Registry::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
					->register( $key, new Data_Sync_Entry( $entry, $schema ) );
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

/**
 * Register module status options for each feature.
 */
foreach ( Automattic\Jetpack_Boost\Modules\Modules::MODULES as $feature_class ) {
	jetpack_boost_register_option( ( new Status( $feature_class::get_slug() ) )->get_ds_entry_name(), Schema::as_boolean()->fallback( false ) );
}
