<?php

/**
 * Just a sack of functions.  Not actually an IXR_Server
 */
class Jetpack_XMLRPC_Server {
	/**
	 * A reference to $GLOBALS['wp_xmlrpc_server'];
	 */
	var $wp_xmlrpc_server = null;

	/**
	 * The current error object
	 */
	var $error = null;

	/**
	 * Since we're not extending wp_xmlrpc_server via wp_xmlrpc_server_class, store it as a reference.
	 */
	function Jetpack_XMLRPC_Server( &$wp_xmlrpc_server ) {
		$this->wp_xmlrpc_server =& $wp_xmlrpc_server;
	}

	/**
	 * Whitelist of the XML-RPC methods available to the Jetpack Server. If the 
	 * user is not authenticated (->login()) then the methods are never added,
	 * so they will get a "does not exist" error.
	 */
	function xmlrpc_methods() {
		if ( !$user = $this->login() ) {
			return array();
		}

		return apply_filters( 'jetpack_xmlrpc_methods', array(
			'jetpack.testConnection'    => array( &$this, 'test_connection' ),
			'jetpack.featuresAvailable' => array( &$this, 'features_available' ),
			'jetpack.featuresEnabled'   => array( &$this, 'features_enabled' ),
			'jetpack.getPost'           => array( &$this, 'get_post' ),
			'jetpack.getComment'        => array( &$this, 'get_comment' ),  
		) );
	}

	/**
	 * Whitelist of the bootstrap XML-RPC methods
	 */
	function bootstrap_xmlrpc_methods() {
		return array(
			'jetpack.verifyRegistration' => array( &$this, 'verify_registration' ),
		);
	}

	/**
	 * Verifies that Jetpack.WordPress.com received a registration request from this site
	 *
	 * @return WP_Error|string secret_2 on success, WP_Error( error_code => error_code, error_message => error description, error_data => status code ) on failure
	 *
	 * Possible error_codes:
	 *
	 * verify_secret_1_missing
	 * verify_secret_1_malformed
	 * verify_secrets_missing: No longer have verification secrets stored
	 * verify_secrets_mismatch: stored secret_1 does not match secret_1 sent by Jetpack.WordPress.com
	 */
	function verify_registration( $verify_secret ) {
		if ( empty( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_missing', sprintf( 'The required "%s" parameter is missing.', 'secret_1' ), 400 ) );
		} else if ( !is_string( $verify_secret ) ) {
			return $this->error( new Jetpack_Error( 'verify_secret_1_malformed', sprintf( 'The required "%s" parameter is malformed.', 'secret_1' ), 400 ) );
		}

		$secrets = Jetpack::get_option( 'register' );
		if ( !$secrets || is_wp_error( $secrets ) ) {
			Jetpack::delete_option( 'register' );
			return $this->error( new Jetpack_Error( 'verify_secrets_missing', 'Verification took too long', 400 ) );
		}

		@list( $secret_1, $secret_2, $secret_eol ) = explode( ':', $secrets );
		if ( empty( $secret_1 ) || empty( $secret_2 ) || empty( $secret_eol ) || $secret_eol < time() ) {
			Jetpack::delete_option( 'register' );
			return $this->error( new Jetpack_Error( 'verify_secrets_missing', 'Verification took too long', 400 ) );
		}

		if ( $verify_secret !== $secret_1 ) {
			Jetpack::delete_option( 'register' );
			return $this->error( new Jetpack_Error( 'verify_secrets_mismatch', 'Secret mismatch', 400 ) );
		}

		Jetpack::delete_option( 'register' );

		return $secret_2;
	}

	/**
	 * Wrapper for wp_authenticate( $username, $password );
	 *
	 * @return WP_User|IXR_Error
	 */
	function login() {
		$user = wp_authenticate( 'username', 'password' );
		if ( is_wp_error( $user ) ) {
			if ( 'authentication_failed' == $user->get_error_code() ) { // Generic error could mean most anything.
				$this->error =& new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			} else {
				$this->error = $user;
			}
			return false;
		} else if ( !$user ) { // Shouldn't happen.
			$this->error =& new Jetpack_Error( 'invalid_request', 'Invalid Request', 403 );
			return false;
		}

		return $user;
	}

	/**
	 * Returns the current error as an IXR_Error
	 *
	 * @return null|IXR_Error
	 */
	function error( $error = null ) {
		if ( !is_null( $error ) ) {
			$this->error = $error;
		}

		if ( is_wp_error( $this->error ) ) {
			$code = $this->error->get_error_data();
			if ( !$code ) {
				$code = -10520;
			}
			$message = sprintf( 'Jetpack: [%s] %s', $this->error->get_error_code(), $this->error->get_error_message() );
			return new IXR_Error( $code, $message );
		} else if ( is_a( $this->error, 'IXR_Error' ) ) {
			return $this->error;
		}

		return false;
	}

/* API Methods */

	/**
	 * Just authenticates with the given Jetpack credentials.
	 *
	 * @return bool|IXR_Error
	 */
	function test_connection() {
		return true;
	}

	/**
	 * Returns what features are available. Uses the slug of the module files.
	 *
	 * @return array|IXR_Error
	 */
	function features_available() {
		$raw_modules = Jetpack::get_available_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}

	/**
	 * Returns what features are enabled. Uses the slug of the modules files.
	 *
	 * @return array|IXR_Error
	 */
	function features_enabled() {
		$raw_modules = Jetpack::get_active_modules();
		$modules = array();
		foreach ( $raw_modules as $module ) {
			$modules[] = Jetpack::get_module_slug( $module );
		}

		return $modules;
	}
	
	function get_post( $id ) {
		if ( !$id = (int) $id ) {
			return false;
		}

		$jetpack = Jetpack::init();
		$post = $jetpack->get_post( $id );

		if (
			is_array( $post )
		&&
			empty( $post['post_password'] )
		&&
			in_array( $post['post_type'], get_post_types( array( 'public' => true ) ) )
		&&
			in_array( $post['post_status'], get_post_stati( array( 'public' => true ) ) )
		) {
			return $post;
		}

		return false;
	}
	
	function get_comment( $id ) {
		if ( !$id = (int) $id ) {
			return false;
		}

		$jetpack = Jetpack::init();
		$comment = $jetpack->get_comment( $id );

		if ( !is_array( $comment ) )
			return false;

		if ( !$this->get_post( $comment['comment_post_ID'] ) )
			return false;

		return $comment;
	}
}
