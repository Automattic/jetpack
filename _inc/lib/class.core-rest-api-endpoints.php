<?php
require_once ABSPATH . '/wp-includes/class-wp-error.php';

add_action( 'rest_api_init', 'jetpack_core_json_api_init' );
function jetpack_core_json_api_init() {

	register_rest_route( 'jetpack/v4', '/modules', array(
		'methods' => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::get_modules',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

	register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)', array(
		'methods' => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::get_module',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

	// Activate a Module
	register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/activate', array(
		'methods' => WP_REST_Server::EDITABLE,
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::activate_module',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

	// Deactivate a Module
	register_rest_route( 'jetpack/v4', '/module/(?P<slug>[a-z\-]+)/deactivate', array(
		'methods' => WP_REST_Server::EDITABLE,
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::deactivate_module',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );


	// Protect: Get blocked count
	register_rest_route( 'jetpack/v4', '/module/protect/count/get', array(
		'methods' => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::protect_get_blocked_count',
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );

	// Akismet: Get spam count
	register_rest_route( 'jetpack/v4', '/akismet/count/get', array(
		'methods'  => 'GET',
		'callback' => 'Jetpack_Core_Json_Api_Endpoints::akismet_get_spam_count',
		'args'     => array(
			'date' => array(
				'default' => 'all',
				'required' => true,
				'sanitize_callback' => 'absint'
			),
		),
		'permission_callback' => 'Jetpack_Core_Json_Api_Endpoints::manage_modules_permission_check',
	) );
}

class Jetpack_Core_Json_Api_Endpoints {
	public static function manage_modules_permission_check() {
		return current_user_can( 'jetpack_manage_modules' );
	}

	/*
	 * Check if given slug is actually a Jetpack module
	 *
	 * @param  string $slug
	 * @return bool   true|false
	 */
	public static function is_jetpack_module( $slug ) {
		$modules = Jetpack::get_available_modules();
		if ( ! in_array( $slug, $modules, true ) ) {
			return false;
		}

		return true;
	}

	/*
	 * Checks if a plugin is active, and includes the files necessary to do so.
	 *
	 * @param  string $plugin the path of the main plugin file.
	 * @return bool true|false
	 */
	public static function is_plugin_activated( $plugin ) {
		require_once ABSPATH . '/wp-admin/includes/plugin.php';
		return is_plugin_active( $plugin );
	}

	/*
	 * Is Akismet registered and active?
	 *
	 * @return true|WP_Error on failure.
	 */
	public static function akismet_is_active_and_registered() {
		if ( ! self::is_plugin_activated( 'akismet/akismet.php' ) ) {
			return new WP_Error( 'not-active', __( 'Please activate akismet.' ), array( 'status' => 404 ) );
		}

		require_once WP_PLUGIN_DIR . '/akismet/class.akismet.php';
		require_once WP_PLUGIN_DIR . '/akismet/class.akismet-admin.php';
		$akismet_key = Akismet::verify_key( Akismet::get_api_key() );

		if ( ! $akismet_key || 'invalid' === $akismet_key || 'failed' === $akismet_key ) {
			return new WP_Error( 'akismet-no-key', __( 'No valid API key for Akismet' ), array( 'status' => 404 ) );
		}

		return true;
	}


	public static function get_modules() {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );
		return Jetpack_Admin::init()->get_modules();
	}

	public static function get_module( $data ) {
		if ( self::is_jetpack_module( $data['slug'] ) ) {
			return Jetpack::get_module( $data['slug'] );
		}

		return new WP_Error( 'not-found', __( 'The requested Jetpack module was not found.' ), array( 'status' => 404 ) );
	}

	public static function activate_module( $data ) {
		if ( self::is_jetpack_module( $data['slug'] ) ) {
			return Jetpack::activate_module( $data['slug'], true, false );
		}

		return new WP_Error( 'not-found', __( 'The requested Jetpack module was not found.' ), array( 'status' => 404 ) );
	}

	public static function deactivate_module( $data ) {
		if ( self::is_jetpack_module( $data['slug'] ) ) {
			return Jetpack::deactivate_module( $data['slug'] );
		}

		return new WP_Error( 'not-found', __( 'The requested Jetpack module was not found.' ), array( 'status' => 404 ) );
	}


	/*
	 * Admin stats stuff
	 */
	public static function protect_get_blocked_count() {
		if ( Jetpack::is_module_active( 'protect' ) ) {
			return get_site_option( 'jetpack_protect_blocked_attempts' );
		}

		return new WP_Error( 'not-active', __( 'The requested Jetpack module is not active.' ), array( 'status' => 404 ) );
	}

	public static function akismet_get_spam_count( WP_REST_Request $data ) {
		if ( ! is_wp_error( $status = self::akismet_is_active_and_registered() ) ) {
			$count_data = Akismet_Admin::get_stats( Akismet::get_api_key() );
		} else {
			return $status->get_error_messages();
		}

		if ( 'all' === $data['date'] ) {
			return $count_data['all']->spam;
		}

		// Organize the requested date time to YYYY-MM
		$data['date'] = DateTime::createFromFormat( 'Ym', $data['date'] );
		return $count_data['6-months']->breakdown->{ $data['date']->format( 'Y-m' ) }->spam;
	}

}

