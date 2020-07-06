<?php
/**
 * The Jetpack Connection error class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection Errors that handles errors
 *
 * This class handles the following workflow:
 *
 * 1. A XML-RCP request with an invalid signature triggers a error
 * 2. Applies a gate to only process each error code once an hour to avoid overflow
 * 3. It stores the error on the database, but we don't know yet if this is a valid error, because
 *    we can't confirm it came from WP.com.
 * 4. It encrypts the error details and send it to thw wp.com server
 * 5. wp.com checks it and, if valid, sends a new request back to this site using the verify_xml_rpc_error REST endpoint
 * 6. This endpoint add this error to the Verified errors in the database
 * 7. Triggers a workflow depending on the error (display user an error message, do some self healing, etc.)
 *
 * Errors are stored in the database as options in the following format:
 *
 * [
 *   $error_code => [
 *     $user_id => [
 *       $error_details
 *     ]
 *   ]
 * ]
 *
 * For each error code we store a maximum of 5 errors for 5 different user ids.
 *
 * An user ID can be
 * * 0 for blog tokens
 * * positive integer for user tokens
 * * 'invalid' for malformed tokens
 *
 * @since 8.7.0
 */
class Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @since 8.7.0
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_errors';

	/**
	 * The name of the option that stores the errors
	 *
	 * @since 8.7.0
	 *
	 * @var string
	 */
	const STORED_VERIFIED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_verified_errors';

	/**
	 * The prefix of the transient that controls the gate for each error code
	 *
	 * @since 8.7.0
	 *
	 * @var string
	 */
	const ERROR_REPORTING_GATE = 'jetpack_connection_error_reporting_gate_';

	/**
	 * Time in seconds a test should live in the database before being discarded
	 *
	 * @since 8.7.0
	 */
	const ERROR_LIFE_TIME = DAY_IN_SECONDS;
	/**
	 * List of known errors. Only error codes in this list will be handled
	 *
	 * @since 8.7.0
	 *
	 * @var array
	 */
	public $known_errors = array(
		'malformed_token',
		'malformed_user_id',
		'unknown_user',
		'no_user_tokens',
		'empty_master_user_option',
		'no_token_for_user',
		'token_malformed',
		'user_id_mismatch',
		'no_possible_tokens',
		'no_valid_token',
		'unknown_token',
		'could_not_sign',
		'invalid_scheme',
		'invalid_secret',
		'invalid_token',
		'token_mismatch',
		'invalid_body',
		'invalid_signature',
		'invalid_body_hash',
		'invalid_nonce',
		'signature_mismatch',
	);

	/**
	 * Holds the instance of this singleton class
	 *
	 * @since 8.7.0
	 *
	 * @var Error_Handler $instance
	 */
	public static $instance = null;

	/**
	 * Initialize instance, hookds and load verified errors handlers
	 *
	 * @since 8.7.0
	 */
	private function __construct() {
		defined( 'JETPACK__ERRORS_PUBLIC_KEY' ) || define( 'JETPACK__ERRORS_PUBLIC_KEY', 'KdZY80axKX+nWzfrOcizf0jqiFHnrWCl9X8yuaClKgM=' );

		add_action( 'rest_api_init', array( $this, 'register_verify_error_endpoint' ) );

		$this->handle_verified_errors();

		// If the site gets reconnected, clear errors.
		add_action( 'jetpack_site_registered', array( $this, 'delete_all_errors' ) );
		add_action( 'jetpack_get_site_data_success', array( $this, 'delete_all_errors' ) );
	}

	/**
	 * Gets the list of verified errors and act upon them
	 *
	 * @since 8.7.0
	 *
	 * @return void
	 */
	public function handle_verified_errors() {
		$verified_errors = $this->get_verified_errors();
		foreach ( $verified_errors as $error_code => $user_errors ) {

			switch ( $error_code ) {
				case 'malformed_token':
				case 'token_malformed':
				case 'no_possible_tokens':
				case 'no_valid_token':
				case 'unknown_token':
				case 'could_not_sign':
				case 'invalid_token':
				case 'token_mismatch':
				case 'invalid_signature':
				case 'signature_mismatch':
					new Error_Handlers\Invalid_Blog_Token( $user_errors );
					break;
			}
		}
	}

	/**
	 * Gets the instance of this singleton class
	 *
	 * @since 8.7.0
	 *
	 * @return Error_Handler $instance
	 */
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Keep track of a connection error that was encountered
	 *
	 * @since 8.7.0
	 *
	 * @param \WP_Error $error the error object.
	 * @param boolean   $force Force the report, even if should_report_error is false.
	 * @return void
	 */
	public function report_error( \WP_Error $error, $force = false ) {
		if ( in_array( $error->get_error_code(), $this->known_errors, true ) && $this->should_report_error( $error ) || $force ) {
			$stored_error = $this->store_error( $error );
			if ( $stored_error ) {
				$this->send_error_to_wpcom( $stored_error );
			}
		}
	}

	/**
	 * Checks the status of the gate
	 *
	 * This protects the site (and WPCOM) against over loads.
	 *
	 * @since 8.7.0
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean $should_report True if gate is open and the error should be reported.
	 */
	public function should_report_error( \WP_Error $error ) {

		if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
			return true;
		}

		/**
		 * Whether to bypass the gate for XML-RPC error handling
		 *
		 * By default, we only process XML-RPC errors once an hour for each error code.
		 * This is done to avoid overflows. If you need to disable this gate, you can set this variable to true.
		 *
		 * This filter is useful for unit testing
		 *
		 * @since 8.7.0
		 *
		 * @param boolean $bypass_gate whether to bypass the gate. Default is false, do not bypass.
		 */
		$bypass_gate = apply_filters( 'jetpack_connection_bypass_error_reporting_gate', false );
		if ( true === $bypass_gate ) {
			return true;
		}

		$transient = self::ERROR_REPORTING_GATE . $error->get_error_code();

		if ( get_transient( $transient ) ) {
			return false;
		}

		set_transient( $transient, true, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Stores the error in the database so we know there is an issue and can inform the user
	 *
	 * @since 8.7.0
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if stored errors were not updated and the error array if it was successfully stored.
	 */
	public function store_error( \WP_Error $error ) {

		$stored_errors = $this->get_stored_errors();
		$error_array   = $this->wp_error_to_array( $error );
		$error_code    = $error->get_error_code();
		$user_id       = $error_array['user_id'];

		if ( ! isset( $stored_errors[ $error_code ] ) || ! is_array( $stored_errors[ $error_code ] ) ) {
			$stored_errors[ $error_code ] = array();
		}

		$stored_errors[ $error_code ][ $user_id ] = $error_array;

		// Let's store a maximum of 5 different user ids for each error code.
		if ( count( $stored_errors[ $error_code ] ) > 5 ) {
			// array_shift will destroy keys here because they are numeric, so manually remove first item.
			$keys = array_keys( $stored_errors[ $error_code ] );
			unset( $stored_errors[ $error_code ][ $keys[0] ] );
		}

		if ( update_option( self::STORED_ERRORS_OPTION, $stored_errors ) ) {
			return $error_array;
		}

		return false;

	}

	/**
	 * Converts a WP_Error object in the array representation we store in the database
	 *
	 * @since 8.7.0
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if error is invalid or the error array
	 */
	public function wp_error_to_array( \WP_Error $error ) {

		$data = $error->get_error_data();

		if ( ! isset( $data['signature_details'] ) || ! is_array( $data['signature_details'] ) ) {
			return false;
		}

		$data = $data['signature_details'];

		if ( ! isset( $data['token'] ) || empty( $data['token'] ) ) {
			return false;
		}

		$user_id = $this->get_user_id_from_token( $data['token'] );

		$error_array = array(
			'error_code'    => $error->get_error_code(),
			'user_id'       => $user_id,
			'error_message' => $error->get_error_message(),
			'error_data'    => $data,
			'timestamp'     => time(),
			'nonce'         => wp_generate_password( 10, false ),
		);

		return $error_array;

	}

	/**
	 * Sends the error to WP.com to be verified
	 *
	 * @since 8.7.0
	 *
	 * @param array $error_array The array representation of the error as it is stored in the database.
	 * @return bool
	 */
	public function send_error_to_wpcom( $error_array ) {

		$blog_id = \Jetpack_Options::get_option( 'id' );

		$encrypted_data = $this->encrypt_data_to_wpcom( $error_array );

		if ( false === $encrypted_data ) {
			return false;
		}

		$args = array(
			'body' => array(
				'error_data' => $encrypted_data,
			),
		);

		// send encrypted data to WP.com Public-API v2.
		wp_remote_post( "https://public-api.wordpress.com/wpcom/v2/sites/{$blog_id}/jetpack-report-error/", $args );
		return true;
	}

	/**
	 * Encrypt data to be sent over to WP.com
	 *
	 * @since 8.7.0
	 *
	 * @param array|string $data the data to be encoded.
	 * @return boolean|string The encoded string on success, false on failure
	 */
	public function encrypt_data_to_wpcom( $data ) {

		try {
			// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			$encrypted_data = base64_encode( sodium_crypto_box_seal( wp_json_encode( $data ), base64_decode( JETPACK__ERRORS_PUBLIC_KEY ) ) );
			// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
			// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		} catch ( \SodiumException $e ) {
			// error encrypting data.
			return false;
		}

		return $encrypted_data;

	}

	/**
	 * Extracts the user ID from a token
	 *
	 * @since 8.7.0
	 *
	 * @param string $token the token used to make the xml-rpc request.
	 * @return string $the user id or `invalid` if user id not present.
	 */
	public function get_user_id_from_token( $token ) {
		$parsed_token = explode( ':', wp_unslash( $token ) );

		if ( isset( $parsed_token[2] ) && ! empty( $parsed_token[2] ) && ctype_digit( $parsed_token[2] ) ) {
			$user_id = $parsed_token[2];
		} else {
			$user_id = 'invalid';
		}

		return $user_id;

	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @since 8.7.0
	 *
	 * @return array $errors
	 */
	public function get_stored_errors() {

		$stored_errors = get_option( self::STORED_ERRORS_OPTION );

		if ( ! is_array( $stored_errors ) ) {
			$stored_errors = array();
		}

		$stored_errors = $this->garbage_collector( $stored_errors );

		return $stored_errors;
	}

	/**
	 * Gets the verified errors stored in the database
	 *
	 * @since 8.7.0
	 *
	 * @return array $errors
	 */
	public function get_verified_errors() {

		$verified_errors = get_option( self::STORED_VERIFIED_ERRORS_OPTION );

		if ( ! is_array( $verified_errors ) ) {
			$verified_errors = array();
		}

		$verified_errors = $this->garbage_collector( $verified_errors );

		return $verified_errors;
	}

	/**
	 * Removes expired errors from the array
	 *
	 * This method is called by get_stored_errors and get_verified errors and filters their result
	 * Whenever a new error is stored to the database or verified, this will be triggered and the
	 * expired error will be permantently removed from the database
	 *
	 * @since 8.7.0
	 *
	 * @param array $errors array of errors as stored in the database.
	 * @return array
	 */
	private function garbage_collector( $errors ) {
		foreach ( $errors as $error_code => $users ) {
			foreach ( $users as $user_id => $error ) {
				if ( self::ERROR_LIFE_TIME < time() - (int) $error['timestamp'] ) {
					unset( $errors[ $error_code ][ $user_id ] );
				}
			}
		}
		// Clear empty error codes.
		$errors = array_filter(
			$errors,
			function( $user_errors ) {
				return ! empty( $user_errors );
			}
		);
		return $errors;
	}

	/**
	 * Delete all stored and verified errors from the database
	 *
	 * @since 8.7.0
	 *
	 * @return void
	 */
	public function delete_all_errors() {
		$this->delete_stored_errors();
		$this->delete_verified_errors();
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @since 8.7.0
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_stored_errors() {
		return delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Delete the verified errors stored in the database
	 *
	 * @since 8.7.0
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_verified_errors() {
		return delete_option( self::STORED_VERIFIED_ERRORS_OPTION );
	}

	/**
	 * Gets an error based on the nonce
	 *
	 * Receives a nonce and finds the related error.
	 *
	 * @since 8.7.0
	 *
	 * @param string $nonce The nonce created for the error we want to get.
	 * @return null|array Returns the error array representation or null if error not found.
	 */
	public function get_error_by_nonce( $nonce ) {
		$errors = $this->get_stored_errors();
		foreach ( $errors as $user_group ) {
			foreach ( $user_group as $error ) {
				if ( $error['nonce'] === $nonce ) {
					return $error;
				}
			}
		}
		return null;
	}

	/**
	 * Adds an error to the verified error list
	 *
	 * @since 8.7.0
	 *
	 * @param array $error The error array, as it was saved in the unverified errors list.
	 * @return void
	 */
	public function verify_error( $error ) {

		$verified_errors = $this->get_verified_errors();
		$error_code      = $error['error_code'];
		$user_id         = $error['user_id'];

		if ( ! isset( $verified_errors[ $error_code ] ) ) {
			$verified_errors[ $error_code ] = array();
		}

		$verified_errors[ $error_code ][ $user_id ] = $error;

		update_option( self::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );

	}

	/**
	 * Register REST API end point for error hanlding.
	 *
	 * @since 8.7.0
	 *
	 * @return void
	 */
	public function register_verify_error_endpoint() {
		register_rest_route(
			'jetpack/v4',
			'/verify_xmlrpc_error',
			array(
				'methods'  => \WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'verify_xml_rpc_error' ),
				'args'     => array(
					'nonce' => array(
						'required' => true,
						'type'     => 'string',
					),
				),
			)
		);
	}

	/**
	 * Handles verification that a xml rpc error is legit and came from WordPres.com
	 *
	 * @since 8.7.0
	 *
	 * @param \WP_REST_Request $request The request sent to the WP REST API.
	 *
	 * @return boolean
	 */
	public function verify_xml_rpc_error( \WP_REST_Request $request ) {

		$error = $this->get_error_by_nonce( $request['nonce'] );

		if ( $error ) {
			$this->verify_error( $error );
			return new \WP_REST_Response( true, 200 );
		}

		return new \WP_REST_Response( false, 200 );

	}

}
