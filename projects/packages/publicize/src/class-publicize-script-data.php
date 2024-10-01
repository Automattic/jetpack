<?php
/**
 * Publicize_Script_Data.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;
use Automattic\Jetpack\Status\Host;
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

		if ( ! $publicize && function_exists( 'publicize_init' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check
			publicize_init();
		}

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

		if ( empty( $data['site']['plan']['product_slug'] ) ) {
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
			'api_paths'            => array(),
			'is_publicize_enabled' => Utils::is_publicize_active(),
			'feature_flags'        => self::get_feature_flags(),
			'supported_services'   => array(),
			'shares_data'          => array(),
		);

		if ( ! Utils::is_publicize_active() ) {
			return $basic_data;
		}

		// Simple sites don't have a user connection.
		$is_publicize_configured = ( new Host() )->is_wpcom_simple() || Utils::is_connected();

		if ( ! $is_publicize_configured ) {
			return $basic_data;
		}

		return array_merge(
			$basic_data,
			array(
				'api_paths'          => self::get_api_paths(),
				'supported_services' => self::get_supported_services(),
				'shares_data'        => self::get_shares_data(),
				/**
				 * 'store'       => self::get_store_script_data(),
				 * 'urls'        => self::get_urls(),
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
			'useAdminUiV1'     => 'connections-management',
			'useEditorPreview' => 'editor-preview',
			'useShareStatus'   => 'share-status',
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

	/**
	 * Get the shares data.
	 *
	 * @return ?array
	 */
	public static function get_shares_data() {
		return self::publicize()->get_publicize_shares_info( Jetpack_Options::get_option( 'id' ) );
	}

	/**
	 * Get the list of supported Publicize services.
	 *
	 * @return array List of external services and their settings.
	 */
	public static function get_supported_services() {
		$site_id = Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return array();
		}
		$path     = sprintf( '/sites/%d/external-services', $site_id );
		$response = Client::wpcom_json_api_request_as_user( $path );
		if ( is_wp_error( $response ) ) {
			return array();
		}
		$body = json_decode( wp_remote_retrieve_body( $response ) );

		$services = $body->services ?? array();

		return array_values(
			array_filter(
				(array) $services,
				function ( $service ) {
					return isset( $service->type ) && 'publicize' === $service->type;
				}
			)
		);
	}

	/**
	 * Get the API paths.
	 *
	 * @return array
	 */
	public static function get_api_paths() {

		$is_simple_site = ( new Host() )->is_wpcom_simple();

		if ( $is_simple_site ) {
			return array(
				'refreshConnections' => '/wpcom/v2/publicize/connection-test-results',
				'resharePost'        => '/wpcom/v2/posts/{postId}/publicize',
			);
		}

		return array(
			'refreshConnections' => '/jetpack/v4/publicize/connections?test_connections=1',
			'resharePost'        => '/jetpack/v4/publicize/{postId}',
		);
	}
}
