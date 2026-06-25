<?php
/**
 * Jetpack_Script_Data.
 *
 * Adds Jetpack-plugin-specific data to the consolidated JetpackScriptData object.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Status;

/**
 * Jetpack_Script_Data class.
 */
class Jetpack_Script_Data {

	/**
	 * Configure script data.
	 */
	public static function configure() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'set_admin_script_data' ), 10, 1 );
	}

	/**
	 * Add Jetpack-plugin-specific data to the consolidated JetpackScriptData object.
	 *
	 * @since 15.6
	 *
	 * @param array $data The script data.
	 * @return array
	 */
	public static function set_admin_script_data( $data ) {
		$jetpack_data = isset( $data['jetpack'] ) && is_array( $data['jetpack'] ) ? $data['jetpack'] : array();
		$flags        = isset( $jetpack_data['flags'] ) && is_array( $jetpack_data['flags'] ) ? $jetpack_data['flags'] : array();
		$status       = new Status();

		/**
		 * Whether to show the Jetpack branding in editor panels (e.g., SEO, AI Assistant).
		 *
		 * @since 15.6
		 *
		 * @param bool $show Whether to show the Jetpack editor panel branding. Defaults to true.
		 */
		$flags['showJetpackBranding'] = (bool) apply_filters( 'jetpack_show_editor_panel_branding', true );

		$jetpack_data['flags']                = $flags;
		$jetpack_data['isMyJetpackAvailable'] = class_exists( My_Jetpack_Initializer::class ) ? My_Jetpack_Initializer::should_initialize() : false;
		$jetpack_data['isOfflineMode']        = $status->is_offline_mode();
		$data['jetpack']                      = $jetpack_data;

		return $data;
	}
}
