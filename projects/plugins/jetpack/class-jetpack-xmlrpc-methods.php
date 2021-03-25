<?php
/**
 * Jetpack XMLRPC Methods.
 *
 * Registers the Jetpack specific XMLRPC methods
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;

/**
 * XMLRPC Methods registration and callbacks
 */
class Jetpack_XMLRPC_Methods {

	/**
	 * Initialize the main hooks.
	 */
	public static function init() {
		add_filter( 'jetpack_xmlrpc_unauthenticated_methods', array( __CLASS__, 'xmlrpc_methods' ) );
		add_filter( 'jetpack_xmlrpc_test_connection_response', array( __CLASS__, 'test_connection' ) );
	}

	/**
	 * Adds Jetpack specific methods to the methods added by the Connection package.
	 *
	 * @param array $methods Methods added by the Connection package.
	 */
	public static function xmlrpc_methods( $methods ) {

		$methods['jetpack.featuresAvailable'] = array( __CLASS__, 'features_available' );
		$methods['jetpack.featuresEnabled']   = array( __CLASS__, 'features_enabled' );
		$methods['jetpack.disconnectBlog']    = array( __CLASS__, 'disconnect_blog' );
		$methods['jetpack.jsonAPI']           = array( __CLASS__, 'json_api' );

		return $methods;
	}

	/**
	 * Returns what features are available. Uses the slug of the module files.
	 *
	 * @return array
	 */
	public static function features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array
	 */
	public static function features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules     = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Filters the result of test_connection XMLRPC method
	 *
	 * @return string The current Jetpack version number
	 */
	public static function test_connection() {
		return JETPACK__VERSION;
	}

	/**
	 * Disconnect this blog from the connected wordpress.com account
	 *
	 * @return boolean
	 */
	public static function disconnect_blog() {

		/**
		 * Fired when we want to log an event to the Jetpack event log.
		 *
		 * @since 7.7.0
		 *
		 * @param string $code Unique name for the event.
		 * @param string $data Optional data about the event.
		 */
		do_action( 'jetpack_event_log', 'disconnect' );
		Jetpack::disconnect();

		return true;
	}

	/**
	 * Serve a JSON API request.
	 *
	 * @param array $args request arguments.
	 */
	public static function json_api( $args = array() ) {
		$json_api_args        = $args[0];
		$verify_api_user_args = $args[1];

		$method       = (string) $json_api_args[0];
		$url          = (string) $json_api_args[1];
		$post_body    = is_null( $json_api_args[2] ) ? null : (string) $json_api_args[2];
		$user_details = (array) $json_api_args[4];
		$locale       = (string) $json_api_args[5];

		if ( ! $verify_api_user_args ) {
			$user_id = 0;
		} elseif ( 'internal' === $verify_api_user_args[0] ) {
			$user_id = (int) $verify_api_user_args[1];
			if ( $user_id ) {
				$user = get_user_by( 'id', $user_id );
				if ( ! $user || is_wp_error( $user ) ) {
					return false;
				}
			}
		} else {
			$user_id = call_user_func( array( new Jetpack_XMLRPC_Server(), 'test_api_user_code' ), $verify_api_user_args );
			if ( ! $user_id ) {
				return false;
			}
		}

		if ( 'en' !== $locale ) {
			// .org mo files are named slightly different from .com, and all we have is this the locale -- try to guess them.
			$new_locale = $locale;
			if ( strpos( $locale, '-' ) !== false ) {
				$locale_pieces = explode( '-', $locale );
				$new_locale    = $locale_pieces[0];
				$new_locale   .= ( ! empty( $locale_pieces[1] ) ) ? '_' . strtoupper( $locale_pieces[1] ) : '';
			} else {
				// .com might pass 'fr' because thats what our language files are named as, where core seems
				// to do fr_FR - so try that if we don't think we can load the file.
				if ( ! file_exists( WP_LANG_DIR . '/' . $locale . '.mo' ) ) {
					$new_locale = $locale . '_' . strtoupper( $locale );
				}
			}

			if ( file_exists( WP_LANG_DIR . '/' . $new_locale . '.mo' ) ) {
				unload_textdomain( 'default' );
				load_textdomain( 'default', WP_LANG_DIR . '/' . $new_locale . '.mo' );
			}
		}

		$old_user = wp_get_current_user();
		wp_set_current_user( $user_id );

		if ( $user_id ) {
			$token_key = false;
		} else {
			$verified  = ( new Connection_Manager() )->verify_xml_rpc_signature();
			$token_key = $verified['token_key'];
		}

		$token = ( new Tokens() )->get_access_token( $user_id, $token_key );
		if ( ! $token || is_wp_error( $token ) ) {
			return false;
		}

		define( 'REST_API_REQUEST', true );
		define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );

		// needed?
		require_once ABSPATH . 'wp-admin/includes/admin.php';

		require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
		$api                        = WPCOM_JSON_API::init( $method, $url, $post_body );
		$api->token_details['user'] = $user_details;
		require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

		$display_errors = ini_set( 'display_errors', 0 ); // phpcs:ignore WordPress.PHP.IniSet
		ob_start();
		$api->serve( false );
		$output = ob_get_clean();
		ini_set( 'display_errors', $display_errors ); // phpcs:ignore WordPress.PHP.IniSet

		$nonce = wp_generate_password( 10, false );
		$hmac  = hash_hmac( 'md5', $nonce . $output, $token->secret );

		wp_set_current_user( isset( $old_user->ID ) ? $old_user->ID : 0 );

		return array(
			(string) $output,
			(string) $nonce,
			(string) $hmac,
		);
	}
}
