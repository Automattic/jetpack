<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Data_Sync;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Data_Sync\Critical_CSS_Meta_Entry;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Regenerate_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_CSS;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Error_Dismissed;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync_Actions\Set_Provider_Errors;

class Data_Sync_Setup implements Has_Data_Sync {
	public static function register_data_sync( Data_Sync $instance ) {
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
				'cornerstone_page_saved',
				'cornerstone_pages_list_updated',
			)
		)->nullable();

		/**
		 * Register Data Sync Stores
		 */
		$instance->register( 'critical_css_state', $critical_css_state_schema );
		$instance->register( 'critical_css_meta', $critical_css_meta_schema, new Critical_CSS_Meta_Entry() );
		$instance->register( 'critical_css_suggest_regenerate', $critical_css_suggest_regenerate_schema );
		$instance->register_action( 'critical_css_state', 'request-regenerate', Schema::as_void(), new Regenerate_CSS() );

		$instance->register_action(
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

		$instance->register_action(
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

		$instance->register_action(
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
	}
}
