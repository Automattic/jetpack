<?php
/**
 * Publicize_Script_Data.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Jetpack_Social_Settings\Settings;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use Jetpack_Options;

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
	 * Configure initial state.
	 */
	public static function configure() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'set_admin_script_data' ), 10, 1 );
	}

	/**
	 * Set initial state.
	 *
	 * @param array $state Initial state.
	 */
	public static function set_admin_script_data( $state ) {

		$state['social'] = self::get_admin_script_data();

		if ( empty( $state['site']['plan'] ) ) {
			$state['site']['plan'] = Current_Plan::get();
		}

		return $state;
	}

	/**
	 * Get initial state.
	 *
	 * @return array
	 */
	public static function get_admin_script_data() {

		// Only set initial state on the social settings page,
		// the Jetpack settings page, or the block editor.
		$should_set_script_data = Utils::is_jetpack_settings_page()
			|| Utils::is_social_settings_page()
			|| Utils::should_block_editor_have_social();

		if ( ! $should_set_script_data ) {
			return array();
		}

		$basic_state = array(
			'is_publicize_enabled' => Utils::is_publicize_active(),
			'feature_flags'        => self::get_feature_flags(),
		);

		if ( ! Utils::is_publicize_active() || ! Utils::is_connected() ) {
			return $basic_state;
		}

		return array_merge(
			$basic_state,
			array(
				'store'       => self::get_store_script_data(),
				'urls'        => self::get_urls(),
				'shares_data' => self::get_shares_data(),
			)
		);
	}

	/**
	 * Get the feature flags.
	 *
	 * @return array
	 */
	public static function get_feature_flags() {
		return array(
			'useAdminUiV1' => Current_Plan::supports( 'social-connections-management' ),
		);
	}

	/**
	 * Get initial state for social store.
	 *
	 * @return array
	 */
	public static function get_store_script_data() {

		$settings = ( new Settings() );

		return array(
			// TODO - Move this settings array to Settings class.
			'settings'        => array(
				// Since we are already in `settings`, we can remove the `settings` suffix.
				'socialImageGenerator' => $settings->get_settings()['socialImageGeneratorSettings'],
			),
			'connectionsData' => array(
				'connections' => self::publicize()->get_all_connections_for_user(),
				// TODO - Move that `get_services` to the this class.
				'services'    => $settings->get_services(),
			),
		);
	}

	/**
	 * Get the shares data.
	 *
	 * @return ?array
	 */
	public static function get_shares_data() {
		return self::publicize()->get_publicize_shares_info( Jetpack_Options::get_option( 'id' ) );
	}

	/**
	 * Get the URLs need in the initial state.
	 *
	 * @return array
	 */
	public static function get_urls() {

		$urls = array(
			'userConnectionPage' => admin_url( 'admin.php?page=my-jetpack#/connection' ),
			'socialSettingsPage' => self::publicize()->publicize_connections_url(
				'jetpack-social-connections-admin-page'
			),
		);

		// Escape the URLs.
		array_walk( $urls, 'esc_url_raw' );

		return $urls;
	}
}
