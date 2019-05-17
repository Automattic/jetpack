<?php

namespace Jetpack\V7\Connection;

use Jetpack\V7\Connection\Manager_Interface;

class Manager implements Manager_Interface {

	const SECRETS_MISSING = 'secrets_missing';
	const SECRETS_EXPIRED = 'secrets_expired';
	const SECRETS_OPTION_NAME = 'jetpack_secrets';

	/**
	 * The object for managing options.
	 */
	protected $option_manager;

	/**
	 * The procedure that should be run to generate secrets.
	 *
	 * @var Callable
	 */
	protected $secret_callable;

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
	public function initialize( $methods ) {
		
	}

	/**
	 * Returns true if the current site is connected to WordPress.com.
	 *
	 * @return Boolean is the site connected?
	 */
	public function is_active() {

	}

	/**
	 * Returns true if the user with the specified identifier is connected to
	 * WordPress.com.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean is the user connected?
	 */
	public function is_user_connected( $user_id ) {

	}

	/**
	 * Get the wpcom user data of the current|specified connected user.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Object the user object.
	 */
	public function get_connected_user_data( $user_id ) {

	}

	/**
	 * Is the user the connection owner.
	 *
	 * @param Integer $user_id the user identifier.
	 * @return Boolean is the user the connection owner?
	 */
	public function is_connection_owner( $user_id ) {

	}

	/**
	 * Unlinks the current user from the linked WordPress.com user
	 *
	 * @param Integer $user_id the user identifier.
	 */
	public static function disconnect_user( $user_id ) {

	}

	/**
	 * Initializes a transport server, whatever it may be, saves into the object property.
	 * Should be changed to be protected.
	 */
	public function initialize_server() {

	}

	/**
	 * Checks if the current request is properly authenticated, bails if not.
	 * Should be changed to be protected.
	 */
	public function require_authentication() {

	}

	/**
	 * Verifies the correctness of the request signature.
	 * Should be changed to be protected.
	 */
	public function verify_signature() {

	}

	/**
	 * Attempts Jetpack registration which sets up the site for connection. Should
	 * remain public because the call to action comes from the current site, not from
	 * WordPress.com.
	 *
	 * @return Integer zero on success, or a bitmask on failure.
	 */
	public function register() {

	}

	/**
	 * Returns the callable that would be used to generate secrets.
	 *
	 * @return Callable a function that returns a secure string to be used as a secret.
	 */
	public function get_secret_callable() {
		if ( ! isset( $this->secret_callable ) ) {
			/**
			 * Allows modification of the callable that is used to generate connection secrets.
			 *
			 * @param Callable a function or method that returns a secret string.
			 */
			$this->secret_callable = apply_filters( 'jetpack_connection_secret_generator', 'wp_generate_password' );
		}

		return $this->secret_callable;
	}

	/**
	 * Returns the object that is to be used for all option manipulation.
	 *
	 * @return Object $manager an option manager object.
	 */
	public function get_option_manager() {
		if ( ! isset( $this->option_manager ) ) {
			/**
			 * Allows modification of the object that is used to manipulate stored data.
			 *
			 * @param Jetpack_Options an option manager object.
			 */
			$this->option_manager = apply_filters( 'jetpack_connection_option_manager', false );
		}

		return $this->option_manager;
	}

	/**
	 * Generates two secret tokens and the end of life timestamp for them.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @param Integer $exp     Expiration time in seconds.
	 */
	public function generate_secrets( $action, $user_id, $exp ) {
		$callable = $this->get_secret_callable();

		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secret_value = array(
			'secret_1'  => call_user_func( $callable ),
			'secret_2'  => call_user_func( $callable ),
			'exp'       => time() + $exp,
		);

		$secrets[ $secret_name ] = $secret_value;

		$this->get_option_manager()->update_option( self::SECRETS_OPTION_NAME, $secrets );
		return $secrets[ $secret_name ];
	}

	/**
	 * Returns two secret tokens and the end of life timestamp for them.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @param Integer $exp     Expiration time in seconds.
	 * @return string|array an array of secrets or an error string.
	 */
	public function get_secrets( $action, $user_id, $exp ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets = $this->get_option_manager()->get_option( self::SECRETS_OPTION_NAME, array() );

		if ( ! isset( $secrets[ $secret_name ] ) ) {
			return self::SECRETS_MISSING;
		}

		if ( $secrets[ $secret_name ]['exp'] < time() ) {
			$this->delete_secrets( $action, $user_id );
			return self::SECRETS_EXPIRED;
		}

		return $secrets[ $secret_name ];
	}

	/**
	 * Deletes secret tokens in case they, for example, have expired.
	 *
	 * @param String  $action  The action name.
	 * @param Integer $user_id The user identifier.
	 * @return string|array an array of secrets or an error string.
	 */
	protected function delete_secrets( $action, $user_id ) {
		$secret_name = 'jetpack_' . $action . '_' . $user_id;
		$secrets = $this->get_option_manager()->get_option( self::SECRETS_OPTION_NAME, array() );
		if ( isset( $secrets[ $secret_name ] ) ) {
			unset( $secrets[ $secret_name ] );
			$this->get_option_manager()->update_option( self::SECRETS_OPTION_NAME, $secrets );
		}
	}

	/**
	 * Responds to a WordPress.com call to register the current site.
	 * Should be changed to protected.
	 */
	public function handle_registration() {

	}

	/**
	 * Responds to a WordPress.com call to authorize the current user.
	 * Should be changed to protected.
	 */
	public function handle_authorization() {

	}

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
	public function build_connect_url( $raw, $redirect, $from, $register ) {

	}

	/**
	 * Disconnects from the Jetpack servers.
	 * Forgets all connection details and tells the Jetpack servers to do the same.
	 */
	public function disconnect_site() {

	}
}
