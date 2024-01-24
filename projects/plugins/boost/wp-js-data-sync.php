<?php

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync_Readonly;
use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Schema;
use Automattic\Jetpack_Boost\Data_Sync\Critical_CSS_Meta_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Getting_Started_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Mergeable_Array_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Minify_Excludes_State_Entry;
use Automattic\Jetpack_Boost\Data_Sync\Modules_State_Entry;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Regenerate_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Error_Dismissed;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Errors;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Lib\Premium_Pricing;
use Automattic\Jetpack_Boost\Lib\Super_Cache_Info;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Minify\Minify_JS;

if ( ! defined( 'JETPACK_BOOST_DATASYNC_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_DATASYNC_NAMESPACE', 'jetpack_boost_ds' );
}

/**
 * Make it easier to register a Jetpack Boost Data-Sync option.
 *
 * @param $key    string - The key for this option.
 * @param $parser Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser - The schema for this option.
 * @param $entry  Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Entry|null - The entry handler for this option.
 */
function jetpack_boost_register_option( $key, $parser, $entry = null ) {
	Data_Sync::get_instance( JETPACK_BOOST_DATASYNC_NAMESPACE )
			->register( $key, $parser, $entry );
}

/**
 * Register a new Jetpack Boost Data_Sync Action
 *
 * @param $key         string
 * @param $action_name string
 * @param $instance    Data_Sync_Action
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

// Represents a set of errors that can be stored for a single Provider Key in a Critical CSS state block.
$critical_css_provider_error_set_schema = Schema::as_array(
	Schema::as_assoc_array(
		array(
			'url'     => Schema::as_string(),
			'message' => Schema::as_string(),
			'type'    => Schema::as_string(),
			'meta'    => Schema::any_json_data()->nullable(),
		)
	)->fallback(
		array(
			'url'     => '',
			'message' => '',
			'type'    => '',
		)
	)
);

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
					'errors'        => $critical_css_provider_error_set_schema->nullable(),
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
		'proxy_nonce' => Schema::as_string()->nullable(),
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

/**
 * Register Data Sync Stores
 */
jetpack_boost_register_option( 'critical_css_state', $critical_css_state_schema );
jetpack_boost_register_option( 'critical_css_meta', $critical_css_meta_schema, new Critical_CSS_Meta_Entry() );
jetpack_boost_register_option( 'critical_css_suggest_regenerate', $critical_css_suggest_regenerate_schema );
jetpack_boost_register_action( 'critical_css_state', 'request-regenerate', Schema::as_void(), new Regenerate_CSS() );

jetpack_boost_register_action(
	'critical_css_state',
	'set-provider-css',
	Schema::as_assoc_array(
		array(
			'key' => Schema::as_string(),
			'css' => Schema::as_string(),
		)
	),
	new Set_Provider_CSS()
);

jetpack_boost_register_action(
	'critical_css_state',
	'set-provider-errors',
	Schema::as_assoc_array(
		array(
			'key'    => Schema::as_string(),
			'errors' => $critical_css_provider_error_set_schema,
		)
	),
	new Set_Provider_Errors()
);

jetpack_boost_register_action(
	'critical_css_state',
	'set-provider-errors-dismissed',
	Schema::as_array(
		Schema::as_assoc_array(
			array(
				'key'       => Schema::as_string(),
				'dismissed' => Schema::as_boolean(),
			)
		)
	),
	new Set_Provider_Error_Dismissed()
);

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

jetpack_boost_register_option( 'performance_history_toggle', Schema::as_boolean()->fallback( false ) );
jetpack_boost_register_option(
	'performance_history',
	Schema::as_assoc_array(
		array(
			'periods'   => Schema::as_array(
				Schema::as_assoc_array(
					array(
						'timestamp'  => Schema::as_number(),
						'dimensions' => Schema::as_assoc_array(
							array(
								'desktop_overall_score' => Schema::as_number(),
								'mobile_overall_score'  => Schema::as_number(),
								'desktop_cls'           => Schema::as_number(),
								'desktop_lcp'           => Schema::as_number(),
								'desktop_tbt'           => Schema::as_number(),
								'mobile_cls'            => Schema::as_number(),
								'mobile_lcp'            => Schema::as_number(),
								'mobile_tbt'            => Schema::as_number(),
							)
						),
					)
				)
			),
			'startDate' => Schema::as_number(),
			'endDate'   => Schema::as_number(),
		)
	),
	new Performance_History_Entry()
);

/**
 * Register Super Cache Notice Disabled store.
 */
jetpack_boost_register_option( 'super_cache_notice_disabled', Schema::as_boolean()->fallback( false ) );

/**
 * Entry to store alerts that shouldn't be shown again.
 */
jetpack_boost_register_option(
	'dismissed_alerts',
	Schema::as_assoc_array(
		array(
			'performance_history_fresh_start' => Schema::as_boolean(),
			'score_increase'                  => Schema::as_boolean(),
			'score_decrease'                  => Schema::as_boolean(),
		)
	)->fallback(
		array(
			'performance_history_fresh_start' => false,
			'score_increase'                  => false,
			'score_decrease'                  => false,
		)
	),
	new Mergeable_Array_Entry( JETPACK_BOOST_DATASYNC_NAMESPACE . '_dismissed_alerts' )
);

jetpack_boost_register_readonly_option( 'connection', array( new Connection(), 'get_connection_api_response' ) );
jetpack_boost_register_readonly_option( 'pricing', array( Premium_Pricing::class, 'get_yearly_pricing' ) );
jetpack_boost_register_readonly_option( 'premium_features', array( Premium_Features::class, 'get_features' ) );
jetpack_boost_register_readonly_option( 'super_cache', array( Super_Cache_Info::class, 'get_info' ) );

jetpack_boost_register_option( 'getting_started', Schema::as_boolean()->fallback( false ), new Getting_Started_Entry() );
