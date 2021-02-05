<?php
/**
 * Class Jetpack_Deprecated
 *
 * A place to hold deprecated things from the Jetpack class to try to reduce the size of the mega file.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Functions;
use Automattic\Jetpack\Sync\Users;

/**
 * Class Jetpack_Deprecated
 */
class Jetpack_Deprecated {
	/**
	 * Map of roles we care about, and their corresponding minimum capabilities.
	 *
	 * @deprecated 7.6 Use Automattic\Jetpack\Roles::$capability_translations instead.
	 *
	 * @access public
	 * @static
	 *
	 * @var array
	 */
	public static $capability_translations = array(
		'administrator' => 'manage_options',
		'editor'        => 'edit_others_posts',
		'author'        => 'publish_posts',
		'contributor'   => 'edit_posts',
		'subscriber'    => 'read',
	);

	/**
	 * Checks if a Jetpack site is both active and not in offline mode.
	 *
	 * This is a DRY function to avoid repeating `Jetpack::is_active && ! Automattic\Jetpack\Status->is_offline_mode`.
	 *
	 * @deprecated 8.8.0
	 *
	 * @return bool True if Jetpack is active and not in offline mode.
	 */
	public static function is_active_and_not_development_mode() {
		_deprecated_function( __FUNCTION__, 'jetpack-8.8.0', 'Jetpack::is_active_and_not_offline_mode' );
		if ( ! Jetpack::is_active() || ( new Status() )->is_offline_mode() ) {
			return false;
		}
		return true;
	}

	/**
	 * Deprecated manage functions
	 */
	public function prepare_manage_jetpack_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function manage_activate_screen() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function admin_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function opt_out_jetpack_manage_url() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function opt_in_jetpack_manage_url() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function opt_in_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}
	/**
	 * Deprecated manage functions
	 */
	public function can_display_jetpack_manage_notice() {
		_deprecated_function( __METHOD__, 'jetpack-7.3' );
	}

	/**
	 * Deprecated function
	 *
	 * @deprecated 7.6.0
	 *
	 * @see Automattic\Jetpack\Sync\Modules\Users::is_function_in_backtrace
	 */
	public static function is_function_in_backtrace() {
		_deprecated_function( __METHOD__, 'jetpack-7.6.0' );
	}

	/**
	 * Stores and prints out domains to prefetch for page speed optimization.
	 *
	 * @deprecated 8.8.0 Use Jetpack::add_resource_hints.
	 *
	 * @param string|array $urls URLs to hint.
	 */
	public static function dns_prefetch( $urls = null ) {
		_deprecated_function( __FUNCTION__, 'jetpack-8.8.0', 'Automattic\Jetpack\Assets::add_resource_hint' );
		if ( $urls ) {
			Assets::add_resource_hint( $urls );
		}
	}

	/**
	 * Strip http:// or https:// from a url, replaces forward slash with ::,
	 * so we can bring them directly to their site in calypso.
	 *
	 * @deprecated 9.2.0 Use Automattic\Jetpack\Status::get_site_suffix
	 *
	 * @param string $url URL.
	 */
	public static function build_raw_urls( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.2.0', 'Automattic\Jetpack\Status::get_site_suffix' );

		return ( new Status() )->get_site_suffix( $url );
	}

	/**
	 * Deprecated.
	 *
	 * @deprecated
	 * @see Automattic\Jetpack\Assets\add_async_script
	 */
	public function script_add_async() {
		_deprecated_function( __METHOD__, 'jetpack-8.6.0' );
	}

	/**
	 * Checks whether the home and siteurl specifically are allowed.
	 * Written so that we don't have re-check $key and $value params every time
	 * we want to check if this site is allowed, for example in footer.php
	 *
	 * @since  3.8.0
	 * @return bool True = already allowed False = not on the allowed list.
	 */
	public static function is_staging_site() {
		_deprecated_function( 'Jetpack::is_staging_site', 'jetpack-8.1', '/Automattic/Jetpack/Status->is_staging_site' );
		return ( new Status() )->is_staging_site();
	}

	/**
	 * Serve a WordPress.com static resource via a randomized wp.com subdomain.
	 *
	 * @deprecated 9.3.0 Use Assets::staticize_subdomain.
	 *
	 * @param string $url WordPress.com static resource URL.
	 */
	public static function staticize_subdomain( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', 'Automattic\Jetpack\Assets::staticize_subdomain' );
		return Assets::staticize_subdomain( $url );
	}

	/**
	 * Adds Jetpack-specific options to the output of the XMLRPC options method.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::xmlrpc_options()
	 *
	 * @param array $options Standard Core options.
	 * @return array Amended options.
	 */
	public function xmlrpc_options( $options ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_options' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->xmlrpc_options( $options );
	}

	/**
	 * Handles a getOptions XMLRPC method call.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::jetpack_getOptions()
	 *
	 * @param array $args method call arguments.
	 * @return array an amended XMLRPC server options array.
	 */
	public function jetpack_getOptions( $args ) { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::jetpack_getOptions' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->jetpack_getOptions( $args );
	}

	/**
	 * In some setups, $HTTP_RAW_POST_DATA can be emptied during some IXR_Server paths since it is passed by reference to various methods.
	 * Capture it here so we can verify the signature later.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::xmlrpc_methods()
	 *
	 * @param array $methods XMLRPC methods.
	 * @return array XMLRPC methods, with the $HTTP_RAW_POST_DATA one.
	 */
	public function xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->xmlrpc_methods( $methods );
	}

	/**
	 * Register additional public XMLRPC methods.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::public_xmlrpc_methods()
	 *
	 * @param array $methods Public XMLRPC methods.
	 * @return array Public XMLRPC methods, with the getOptions one.
	 */
	public function public_xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::public_xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->public_xmlrpc_methods( $methods );
	}

	/**
	 * Loads the Jetpack XML-RPC client.
	 * No longer necessary, as the XML-RPC client will be automagically loaded.
	 *
	 * @deprecated since 7.7.0
	 */
	public static function load_xml_rpc_client() {
		_deprecated_function( __METHOD__, 'jetpack-7.7' );
	}

	/**
	 * Resets the saved authentication state in between testing requests.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::reset_saved_auth_state()
	 */
	public function reset_saved_auth_state() {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::reset_saved_auth_state' );
		Connection_Rest_Authentication::init()->reset_saved_auth_state();
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::verify_xml_rpc_signature()
	 *
	 * @return false|array
	 */
	public function verify_xml_rpc_signature() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::verify_xml_rpc_signature' );
		return self::connection()->verify_xml_rpc_signature();
	}

	/**
	 * Verifies the signature of the current request.
	 *
	 * This function has side effects and should not be used. Instead,
	 * use the memoized version `->verify_xml_rpc_signature()`.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::internal_verify_xml_rpc_signature()
	 * @internal
	 */
	private function internal_verify_xml_rpc_signature() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::internal_verify_xml_rpc_signature' );
	}

	/**
	 * Authenticates XML-RPC and other requests from the Jetpack Server.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::authenticate_jetpack()
	 *
	 * @param \WP_User|mixed $user     User object if authenticated.
	 * @param string         $username Username.
	 * @param string         $password Password string.
	 * @return \WP_User|mixed Authenticated user or error.
	 */
	public function authenticate_jetpack( $user, $username, $password ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::authenticate_jetpack' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->authenticate_jetpack( $user, $username, $password );
	}

	/**
	 * Authenticates requests from Jetpack server to WP REST API endpoints.
	 * Uses the existing XMLRPC request signing implementation.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::wp_rest_authenticate()
	 *
	 * @param mixed $user User.
	 */
	public function wp_rest_authenticate( $user ) {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::wp_rest_authenticate' );
		return Connection_Rest_Authentication::init()->wp_rest_authenticate( $user );
	}

	/**
	 * Report authentication status to the WP REST API.
	 *
	 * @deprecated since 8.9.0
	 * @see Automattic\Jetpack\Connection\Rest_Authentication::wp_rest_authentication_errors()
	 *
	 * @param  WP_Error|mixed $value Error from another authentication handler, null if we should handle it, or another value if not.
	 *
	 * @return WP_Error|boolean|null {@see WP_JSON_Server::check_authentication}
	 */
	public function wp_rest_authentication_errors( $value ) {
		_deprecated_function( __METHOD__, 'jetpack-8.9', 'Automattic\\Jetpack\\Connection\\Rest_Authentication::wp_rest_authenication_errors' );
		return Connection_Rest_Authentication::init()->wp_rest_authentication_errors( $value );
	}

	/**
	 * Takes the response from the Jetpack register new site endpoint and
	 * verifies it worked properly.
	 *
	 * @since 2.6
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::validate_remote_register_response()
	 **/
	public function validate_remote_register_response() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::validate_remote_register_response' );
	}

	/**
	 * Builds the timeout limit for queries talking with the wpcom servers.
	 *
	 * Based on local php max_execution_time in php.ini
	 *
	 * @since 2.6
	 * @return int
	 * @deprecated
	 **/
	public function get_remote_query_timeout_limit() {
		_deprecated_function( __METHOD__, 'jetpack-5.4' );
		return Jetpack::get_max_execution_time();
	}

	/**
	 * Deprecated.
	 *
	 * @deprecated 7.5 Use Connection_Manager instead.
	 *
	 * @param string $action Action.
	 * @param mixed  $user_id User ID.
	 */
	public static function delete_secrets( $action, $user_id ) {
		return Jetpack::connection()->delete_secrets( $action, $user_id );
	}

	/**
	 * Returns the Jetpack XML-RPC API
	 *
	 * @deprecated 8.0 Use Connection_Manager instead.
	 * @return string
	 */
	public static function xmlrpc_api_url() {
		_deprecated_function( __METHOD__, 'jetpack-8.0', 'Automattic\\Jetpack\\Connection\\Manager::xmlrpc_api_url()' );
		return Jetpack::connection()->xmlrpc_api_url();
	}

	/**
	 * Deprecated.
	 *
	 * @deprecated 8.0
	 *
	 * @param string $url URL.
	 */
	public static function fix_url_for_bad_hosts( $url ) {
		_deprecated_function( __METHOD__, 'jetpack-8.0' );
		return $url;
	}

	/**
	 * Returns the requested Jetpack API URL
	 *
	 * @deprecated since 7.7
	 *
	 * @param string $relative_url Relative URL.
	 *
	 * @return string
	 */
	public static function api_url( $relative_url ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::api_url' );
		return Jetpack::connection()->api_url( $relative_url );
	}

	/**
	 * Get our assumed site creation date.
	 * Calculated based on the earlier date of either:
	 * - Earliest admin user registration date.
	 * - Earliest date of post of any post type.
	 *
	 * @since 7.2.0
	 * @deprecated since 7.8.0
	 *
	 * @return string Assumed site creation date and time.
	 */
	public static function get_assumed_site_creation_date() {
		_deprecated_function( __METHOD__, 'jetpack-7.8', 'Automattic\\Jetpack\\Connection\\Manager' );
		return self::connection()->get_assumed_site_creation_date();
	}

	/**
	 * Filters the URL that will process the connection data. It can be different from the URL
	 * that we send the user to after everything is done.
	 *
	 * @param String $processing_url the default redirect URL used by the package.
	 * @return String the modified URL.
	 *
	 * @deprecated since Jetpack 9.5.0
	 */
	public static function filter_connect_processing_url( $processing_url ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5' );

		$processing_url = admin_url( 'admin.php?page=jetpack' ); // Making PHPCS happy.
		return $processing_url;
	}

	/**
	 * Sign a user role with the master access token.
	 * If not specified, will default to the current user.
	 *
	 * @deprecated since 7.7
	 * @see Automattic\Jetpack\Connection\Manager::sign_role()
	 *
	 * @access public
	 * @static
	 *
	 * @param string $role    User role.
	 * @param int    $user_id ID of the user.
	 * @return string Signed user role.
	 */
	public static function sign_role( $role, $user_id = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::sign_role' );
		return Jetpack::connection()->sign_role( $role, $user_id );
	}

	/**
	 * Get the minimum capability for a role.
	 *
	 * @deprecated 7.6 Use Automattic\Jetpack\Roles::translate_role_to_cap() instead.
	 *
	 * @access public
	 * @static
	 *
	 * @param string $role Role name.
	 * @return string|boolean Capability, false if role isn't mapped to any capabilities.
	 */
	public static function translate_role_to_cap( $role ) {
		_deprecated_function( __METHOD__, 'jetpack-7.6.0' );

		$roles = new Roles();
		return $roles->translate_role_to_cap( $role );
	}

	/**
	 * Get the role of a particular user.
	 *
	 * @deprecated 7.6 Use Automattic\Jetpack\Roles::translate_user_to_role() instead.
	 *
	 * @access public
	 * @static
	 *
	 * @param \WP_User $user User object.
	 * @return string|boolean User's role, false if not enough capabilities for any of the roles.
	 */
	public static function translate_user_to_role( $user ) {
		_deprecated_function( __METHOD__, 'jetpack-7.6.0' );

		$roles = new Roles();
		return $roles->translate_user_to_role( $user );
	}

	/**
	 * Get the role of the current user.
	 *
	 * @deprecated 7.6 Use Automattic\Jetpack\Roles::translate_current_user_to_role() instead.
	 *
	 * @access public
	 * @static
	 *
	 * @return string|boolean Current user's role, false if not enough capabilities for any of the roles.
	 */
	public static function translate_current_user_to_role() {
		_deprecated_function( __METHOD__, 'jetpack-7.6.0' );

		$roles = new Roles();
		return $roles->translate_current_user_to_role();
	}

	/**
	 * Unlinks the current user from the linked WordPress.com user.
	 *
	 * @deprecated since 7.7
	 * @see Automattic\Jetpack\Connection\Manager::disconnect_user()
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean Whether the disconnection of the user was successful.
	 */
	public static function unlink_user( $user_id = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::disconnect_user' );
		return Connection_Manager::disconnect_user( $user_id );
	}

	/**
	 * Deprecated.
	 */
	public function activate_module_actions() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}

	/**
	 * Deprecated.
	 *
	 * @deprecated 8.0 Use Automattic\Jetpack\Connection\Utils::update_user_token() instead.
	 *
	 * Enters a user token into the user_tokens option
	 *
	 * @param int    $user_id The user id.
	 * @param string $token The user token.
	 * @param bool   $is_master_user Whether the user is the master user.
	 * @return bool
	 */
	public static function update_user_token( $user_id, $token, $is_master_user ) {
		_deprecated_function( __METHOD__, 'jetpack-8.0', 'Automattic\\Jetpack\\Connection\\Utils::update_user_token' );
		return Connection_Utils::update_user_token( $user_id, $token, $is_master_user );
	}

	/**
	 * Deletes the given option.  May be passed multiple option names as an array.
	 * Updates jetpack_options and/or deletes jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::delete_option() instead.
	 * @param string|array $names Option name(s).
	 */
	public static function delete_option( $names ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::delete_option()' );
		return Jetpack_Options::delete_option( $names );
	}

	/**
	 * Updates the multiple given options.  Updates jetpack_options and/or jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::update_options() instead.
	 *
	 * @param array $array array( option name => option value, ... ).
	 */
	public static function update_options( $array ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::update_options()' );
		return Jetpack_Options::update_options( $array );
	}

	/**
	 * Updates the single given option.  Updates jetpack_options or jetpack_$name as appropriate.
	 *
	 * @deprecated 3.4 use Jetpack_Options::update_option() instead.
	 * @param string $name  Option name.
	 * @param mixed  $value Option value.
	 */
	public static function update_option( $name, $value ) {
		_deprecated_function( __METHOD__, 'jetpack-3.4', 'Jetpack_Options::update_option()' );
		return Jetpack_Options::update_option( $name, $value );
	}

	/**
	 * Allows plugins to submit security reports.
	 */
	public static function submit_security_report() {
		_deprecated_function( __FUNCTION__, 'jetpack-4.2', null );
	}

	/**
	 * Synchronize connected user role changes
	 *
	 * @param mixed $user_id User Id.
	 */
	public function user_role_change( $user_id ) {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Users::user_role_change()' );
		Users::user_role_change( $user_id );
	}

	/**
	 * Whether the current user is the connection owner.
	 *
	 * @deprecated since 7.7
	 *
	 * @return bool Whether the current user is the connection owner.
	 */
	public function current_user_is_connection_owner() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::is_connection_owner' );
		return Jetpack::connection()->is_connection_owner();
	}

	/**
	 * Is a given user (or the current user if none is specified) linked to a WordPress.com user?
	 *
	 * @param mixed $user_id User Id.
	 */
	public static function is_user_connected( $user_id = false ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Manager\\is_user_connected' );
		return Jetpack::connection()->is_user_connected( $user_id );
	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 *
	 * @param mixed $user_id User Id.
	 */
	public static function get_connected_user_data( $user_id = null ) {
		_deprecated_function( __METHOD__, 'jetpack-9.5', 'Automattic\\Jetpack\\Connection\\Manager\\get_connected_user_data' );
		return Jetpack::connection()->get_connected_user_data( $user_id );
	}

	/**
	 * Determine whether the active plan supports a particular feature
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::supports.
	 *
	 * @param string $feature Feature.
	 *
	 * @return bool True if plan supports feature, false if not.
	 */
	public static function active_plan_supports( $feature ) {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::supports' );
		return Jetpack_Plan::supports( $feature );
	}

	/**
	 * Make an API call to WordPress.com for plan status
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::refresh_from_wpcom.
	 *
	 * @return bool True if plan is updated, false if no update
	 */
	public static function refresh_active_plan_from_wpcom() {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::refresh_from_wpcom' );
		return Jetpack_Plan::refresh_from_wpcom();
	}

	/**
	 * Get the plan that this Jetpack site is currently using
	 *
	 * @deprecated 7.2.0 Use Jetpack_Plan::get.
	 * @return array Active Jetpack plan details.
	 */
	public static function get_active_plan() {
		_deprecated_function( __METHOD__, 'jetpack-7.2.0', 'Jetpack_Plan::get' );
		return Jetpack_Plan::get();
	}

	/**
	 * Deprecated.
	 */
	public static function refresh_update_data() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );

	}

	/**
	 * Deprecated.
	 */
	public static function refresh_theme_data() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}

	/**
	 * Wrapper for core's get_avatar_url().  This one is deprecated.
	 *
	 * @deprecated 4.7 use get_avatar_url instead.
	 * @param int|string|object $id_or_email A user ID,  email address, or comment object.
	 * @param int               $size Size of the avatar image.
	 * @param string            $default URL to a default image to use if no avatar is available.
	 * @param bool              $force_display Whether to force it to return an avatar even if show_avatars is disabled.
	 *
	 * @return array
	 */
	public static function get_avatar_url( $id_or_email, $size = 96, $default = '', $force_display = false ) {
		_deprecated_function( __METHOD__, 'jetpack-4.7', 'get_avatar_url' );
		return get_avatar_url(
			$id_or_email,
			array(
				'size'          => $size,
				'default'       => $default,
				'force_default' => $force_display,
			)
		);
	}

	/**
	 * Finds out if a site is using a version control system.
	 *
	 * @return string ( '1' | '0' )
	 **/
	public static function is_version_controlled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2', 'Functions::is_version_controlled' );
		return (string) (int) Functions::is_version_controlled();
	}

	/**
	 * Determines whether the current theme supports featured images or not.
	 *
	 * @return string ( '1' | '0' )
	 */
	public static function featured_images_enabled() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
		return current_theme_supports( 'post-thumbnails' ) ? '1' : '0';
	}

	/**
	 * Trigger an update to the main_network_site when we update the siteurl of a site.
	 */
	public function update_jetpack_main_network_site_option() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
	}
	/**
	 * Triggered after a user updates the network settings via Network Settings Admin Page
	 */
	public function update_jetpack_network_settings() {
		_deprecated_function( __METHOD__, 'jetpack-4.2' );
		// Only sync this info for the main network site.
	}

	/**
	 * Require a Jetpack authentication.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::require_jetpack_authentication()
	 */
	public function require_jetpack_authentication() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::require_jetpack_authentication' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->require_jetpack_authentication();
	}

	/**
	 * The callback for the JITM ajax requests.
	 *
	 * @deprecated since 7.9.0
	 */
	public function jetpack_jitm_ajax_callback() {
		_deprecated_function( __METHOD__, 'jetpack-7.9' );
	}

	/**
	 * Since a lot of hosts use a hammer approach to "protecting" WordPress sites,
	 * and just blanket block all requests to /xmlrpc.php, or apply other overly-sensitive
	 * security/firewall policies, we provide our own alternate XML RPC API endpoint
	 * which is accessible via a different URI. Most of the below is copied directly
	 * from /xmlrpc.php so that we're replicating it as closely as possible.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::alternate_xmlrpc()
	 */
	public function alternate_xmlrpc() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::alternate_xmlrpc' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->alternate_xmlrpc();
	}

	/**
	 * Removes all XML-RPC methods that are not `jetpack.*`.
	 * Only used in our alternate XML-RPC endpoint, where we want to
	 * ensure that Core and other plugins' methods are not exposed.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::remove_non_jetpack_xmlrpc_methods()
	 *
	 * @param array $methods A list of registered WordPress XMLRPC methods.
	 * @return array Filtered $methods
	 */
	public function remove_non_jetpack_xmlrpc_methods( $methods ) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::remove_non_jetpack_xmlrpc_methods' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->remove_non_jetpack_xmlrpc_methods( $methods );
	}

	/**
	 * Initialize REST API registration connector.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::initialize_rest_api_registration_connector()
	 */
	public function initialize_rest_api_registration_connector() {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::initialize_rest_api_registration_connector' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		$this->connection_manager->initialize_rest_api_registration_connector();
	}

	/**
	 * Sets up the XMLRPC request handlers.
	 *
	 * @deprecated since 7.7.0
	 * @see Automattic\Jetpack\Connection\Manager::setup_xmlrpc_handlers()
	 *
	 * @param array                 $request_params Incoming request parameters.
	 * @param Boolean               $is_active      Whether the connection is currently active.
	 * @param Boolean               $is_signed      Whether the signature check has been successful.
	 * @param Jetpack_XMLRPC_Server $xmlrpc_server  (optional) An instance of the server to use instead of instantiating a new one.
	 */
	public function setup_xmlrpc_handlers(
		$request_params,
		$is_active,
		$is_signed,
		Jetpack_XMLRPC_Server $xmlrpc_server = null
	) {
		_deprecated_function( __METHOD__, 'jetpack-7.7', 'Automattic\\Jetpack\\Connection\\Manager::setup_xmlrpc_handlers' );

		if ( ! $this->connection_manager ) {
			$this->connection_manager = new Connection_Manager();
		}

		return $this->connection_manager->setup_xmlrpc_handlers(
			$request_params,
			$is_active,
			$is_signed,
			$xmlrpc_server
		);
	}
}
