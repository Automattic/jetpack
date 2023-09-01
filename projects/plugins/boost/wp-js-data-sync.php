<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Data_Sync\Critical_CSS_Meta_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Minify_Excludes_State_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Premium_Features_Entry;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}

/**
 * Make it easier to register a Jetpack Boost Data-Sync option.
 *
 * @param $key    string - The key for this option.
 * @param $schema Schema - The schema for this option.
 * @param $entry  Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry|null - The entry handler for this option.
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
		'providers'    => Schema::as_array(
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
		'status'       => Schema::enum( array( 'not_generated', 'generated', 'pending', 'error' ) )->fallback( 'not_generated' ),
		'created'      => Schema::as_float()->nullable(),
		'updated'      => Schema::as_float()->nullable(),
		'status_error' => Schema::as_string()->nullable(),
	)
)->fallback(
	array(
		'providers' => array(),
		'status'    => 'not_generated',
		'created'   => null,
		'updated'   => null,
	)
);

$critical_css_meta_schema = Schema::as_assoc_array(
	array(
		'callback_passthrough' => Schema::any_json_data()->nullable(),
		'proxy_nonce'          => Schema::as_string()->nullable(),
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
);

$critical_css_suggest_regenerate_schema = Schema::enum(
	array(
		'1', // Old versions of Boost stored a boolean in the DB.
		'page_saved',
		'post_saved',
		'switched_theme',
		'plugin_change',
	)
)->nullable();

$premium_features_schema = Schema::as_array( Schema::as_string() )->fallback( array() );

/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_state', $critical_css_state_schema );
jetpack_boost_register_option( 'critical_css_meta', $critical_css_meta_schema, new Critical_CSS_Meta_Entry() );
jetpack_boost_register_option( 'critical_css_suggest_regenerate', $critical_css_suggest_regenerate_schema );

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

require_once __DIR__ . '/app/modules/image-size-analysis/data-sync/init.php';

/**
 * Register Minify Excludes stores.
 */
$js_excludes_entry  = new Minify_Excludes_State_Entry( 'minify_js_excludes' );
$css_excludes_entry = new Minify_Excludes_State_Entry( 'minify_css_excludes' );
jetpack_boost_register_option( 'minify_js_excludes', Schema::as_array( Schema::as_string() )->fallback( Minify_JS::$default_excludes ), $js_excludes_entry );
jetpack_boost_register_option( 'minify_css_excludes', Schema::as_array( Schema::as_string() )->fallback( Minify_CSS::$default_excludes ), $css_excludes_entry );
jetpack_boost_register_option(
	'image_cdn_quality',
	Schema::as_assoc_array(
		array(
			'jpg'  => Schema::as_assoc_array(
				array(
					'quality'  => Schema::as_number(),
					'lossless' => Schema::as_boolean(),
				)
			),
			'png'  => Schema::as_assoc_array(
				array(
					'quality'  => Schema::as_number(),
					'lossless' => Schema::as_boolean(),
				)
			),
			'webp' => Schema::as_assoc_array(
				array(
					'quality'  => Schema::as_number(),
					'lossless' => Schema::as_boolean(),
				)
			),
		)
	)->fallback(
		array(
			'jpg'  => array(
				'quality'  => 89,
				'lossless' => false,
			),
			'png'  => array(
				'quality'  => 80,
				'lossless' => false,
			),
			'webp' => array(
				'quality'  => 80,
				'lossless' => false,
			),
		)
	)
);

jetpack_boost_register_option( 'premium_features', $premium_features_schema, new Premium_Features_Entry() );

jetpack_boost_register_option( 'performance_history_toggle', Schema::as_boolean()->fallback( false ) );
