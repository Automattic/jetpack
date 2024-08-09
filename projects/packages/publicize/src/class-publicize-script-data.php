<?php
/**
 * Publicize_Script_Data.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;

/**
 * Publicize_Script_Data class.
 */
class Publicize_Script_Data {

	/**
	 * Get the publicize instance - properly typed
	 *
	 * @return Publicize
	 */
	public static function publicize() {
		/**
		 * Publicize instance.
		 *
		 * @var Publicize $publicize
		 */
		global $publicize;

		return $publicize;
	}

	/**
	 * Configure script data.
	 */
	public static function configure() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'set_admin_script_data' ), 10, 1 );
	}

	/**
	 * Set script data.
	 *
	 * @param array $data The script data.
	 */
	public static function set_admin_script_data( $data ) {

		$data['social'] = self::get_admin_script_data();

		if ( empty( $data['site']['plan'] ) ) {
			$data['site']['plan'] = Current_Plan::get();
		}

		return $data;
	}

	/**
	 * Get the script data for admin UI.
	 *
	 * @return array
	 */
	public static function get_admin_script_data() {

		// Only set script data on the social settings page,
		// the Jetpack settings page, or the block editor.
		$should_set_script_data = Utils::is_jetpack_settings_page()
			|| Utils::is_social_settings_page()
			|| Utils::should_block_editor_have_social();

		if ( ! $should_set_script_data ) {
			return array();
		}

		$basic_data = array(
			'is_publicize_enabled' => Utils::is_publicize_active(),
			'feature_flags'        => self::get_feature_flags(),
		);

		if ( ! Utils::is_publicize_active() || ! Utils::is_connected() ) {
			return $basic_data;
		}

		return array_merge(
			$basic_data,
			array(
				/**
				 * 'store'       => self::get_store_script_data(),
				 * 'urls'        => self::get_urls(),
				 * 'shares_data' => self::get_shares_data(),
				 */
			)
		);
	}

	/**
	 * Get the feature flags.
	 *
	 * @return array
	 */
	public static function get_feature_flags() {
		$variable_to_feature_map = array(
			'useAdminUiV1' => 'connections-management',
		);

		$feature_flags = array();

		foreach ( $variable_to_feature_map as $variable => $feature ) {
			$feature_flags[ $variable ] = self::has_feature_flag( $feature );
		}

		return $feature_flags;
	}

	/**
	 * Whether the site has the feature flag enabled.
	 *
	 * @param string $feature The feature name to check for, without the "social-" prefix.
	 * @return bool
	 */
	public static function has_feature_flag( $feature ): bool {
		$flag_name = str_replace( '-', '_', $feature );

		// If the option is set, use it.
		if ( get_option( 'jetpack_social_has_' . $flag_name, false ) ) {
			return true;
		}

		$constant_name = 'JETPACK_SOCIAL_HAS_' . strtoupper( $flag_name );
		// If the constant is set, use it.
		if ( defined( $constant_name ) && constant( $constant_name ) ) {
			return true;
		}

		return Current_Plan::supports( 'social-' . $feature );
	}
}
