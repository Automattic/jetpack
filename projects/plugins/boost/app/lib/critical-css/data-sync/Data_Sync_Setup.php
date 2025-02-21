<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS\Data_Sync;

use Automattic\Jetpack\Schema\Schema;

/**
 * Registers data sync for both the Critical CSS module and the Cloud CSS module. Both of these modules cannot be available at the same time.
 */
class Data_Sync_Schema {
	/**
	 * Represents a set of errors that can be stored for a single Provider Key in a Critical CSS state block.
	 */
	public static function critical_css_provider_error() {
		return Schema::as_array(
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
	}

	public static function critical_css_state() {
		return Schema::as_assoc_array(
			array(
				'providers'    => Schema::as_array(
					Schema::as_assoc_array(
						array(
							'key'              => Schema::as_string(),
							'label'            => Schema::as_string(),
							'urls'             => Schema::as_array( Schema::as_string() ),
							'success_ratio'    => Schema::as_float(),
							'status'           => Schema::enum( array( 'success', 'pending', 'error', 'validation-error' ) )->fallback( 'validation-error' ),
							'dismissed_errors' => Schema::as_array( Schema::as_string() )->nullable(),
							'errors'           => self::critical_css_provider_error()->nullable(),
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
	}

	public static function critical_css_meta() {
		return Schema::as_assoc_array(
			array(
				'proxy_nonce' => Schema::as_string()->nullable(),
			)
		);
	}

	public static function critical_css_suggest_regenerate() {
		return Schema::enum(
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
	}

	public static function critical_css_set_provider() {
		return Schema::as_assoc_array(
			array(
				'key' => Schema::as_string(),
				'css' => Schema::as_string(),
			)
		);
	}

	public static function critical_css_set_provider_errors() {
		return Schema::as_assoc_array(
			array(
				'key'    => Schema::as_string(),
				'errors' => self::critical_css_provider_error(),
			)
		);
	}

	public static function critical_css_set_provider_errors_dismissed() {
		return Schema::as_array(
			Schema::as_assoc_array(
				array(
					'provider'   => Schema::as_string(),
					'error_type' => Schema::as_string(),
					'dismissed'  => Schema::as_boolean(),
				)
			)
		);
	}
}
