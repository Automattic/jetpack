<?php
/**
 * Jetpack_Script_Data.
 *
 * Adds Jetpack-plugin-specific data to the consolidated JetpackScriptData object.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin;

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
		/**
		 * Whether to show the Jetpack branding in editor panels (e.g., SEO, AI Assistant).
		 *
		 * @since 15.6
		 *
		 * @param bool $show Whether to show the Jetpack editor panel branding. Defaults to true.
		 */
		$data['jetpack'] = array(
			'flags' => array(
				'showJetpackBranding' => (bool) apply_filters( 'jetpack_show_editor_panel_branding', true ),
			),
		);

		return $data;
	}
}
