<?php
/**
 * The Jetpack Connection Interface file.
 *
 * @package jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Connection interface class file.
 *
 * @package jetpack-connection
 */

/**
 * The interface that the Connection class must inherit in order to be used for connecting
 * to WordPress.com
 */
interface Manager_Interface {

	/**
	 * Initializes all needed hooks and request handlers. Handles API calls, upload
	 * requests, authentication requests. Also XMLRPC options requests.
	 * Fallback XMLRPC is also a bridge, but probably can be a class that inherits
	 * this one. Among other things it should strip existing methods.
	 *
	 * @param Array $methods an array of API method names for the Connection to accept and
	 *                       pass on to existing callables. It's possible to specify whether
	 *                       each method should be available for unauthenticated calls or not.
	 * @see Jetpack::__construct
	 */
	public function initialize( $methods );

	/**
	 * Returns true if the current site is connected to WordPress.com.
	 *
	 * @return Boolean is the site connected?
	 */
	public function is_active();

	/**
	 * Returns true if the user with the specified identifier is connected to
	 * WordPress.com.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean is the user connected?
	 */
	public function is_user_connected( $user_id );

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Object the user object.
	 */
	public function get_connected_user_data( $user_id );

	/**
	 * Is the user the connection owner.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean is the user the connection owner?
	 */
	public function is_connection_owner( $user_id );

	/**
	 * Unlinks the current user from the linked WordPress.com user
	 *
	 * @param Integer $user_id the user identifier.
	 */
	public static function disconnect_user( $user_id );

	/**
	 * Initializes a transport server, whatever it may be, saves into the object property.
	 * Should be changed to be protected.
	 */
	public function initialize_server();

	/**
	 * Checks if the current request is properly authenticated, bails if not.
	 * Should be changed to be protected.
	 */
	public function require_authentication();

	/**
	 * Verifies the correctness of the request signature.
	 * Should be changed to be protected.
	 */
	public function verify_signature();

	/**
	 * Attempts Jetpack registration which sets up the site for connection. Should
	 * remain public because the call to action comes from the current site, not from
	 * WordPress.com.
	 *
	 * @return Integer zero on success, or a bitmask on failure.
	 */
	public function register();

	/**
	 * Creates two secret tokens and the end of life timestamp for them.
	 *
	 * Note these tokens are unique per call, NOT static per site for connecting.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @return array
	 */
	public function get_secrets( $action, $user_id );

	/**
	 * Responds to a WordPress.com call to register the current site.
	 * Should be changed to protected.
	 *
	 * @param array $registration_data Array of [ secret_1, user_id ].
	 */
	public function handle_registration( array $registration_data );

	/**
	 * Responds to a WordPress.com call to authorize the current user.
	 * Should be changed to protected.
	 */
	public function handle_authorization();

	/**
	 * Builds a URL to the Jetpack connection auth page.
	 * This needs rethinking.
	 *
	 * @param bool        $raw If true, URL will not be escaped.
	 * @param bool|string $redirect If true, will redirect back to Jetpack wp-admin landing page after connection.
	 *                              If string, will be a custom redirect.
	 * @param bool|string $from If not false, adds 'from=$from' param to the connect URL.
	 * @param bool        $register If true, will generate a register URL regardless of the existing token, since 4.9.0.
	 *
	 * @return string Connect URL
	 */
	public function build_connect_url( $raw, $redirect, $from, $register );

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 */
	public function disconnect_site();
}

