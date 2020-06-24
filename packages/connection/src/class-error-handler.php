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
 */
class Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_errors';

	/**
	 * The name of the option that stores the errors
	 *
	 * @var string
	 */
	const STORED_VERIFIED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_verified_errors';

	/**
	 * The prefix of the transient that controls the gate for each error code
	 *
	 * @var string
	 */
	const ERROR_REPORTING_GATE = 'jetpack_connection_error_reporting_gate_';

	/**
	 * List of known errors. Only error codes in this list will be handled
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
	 * @var Error_Handler $instance
	 */
	public static $instance = null;

	/**
	 * Initialize hooks
	 */
	private function __construct() {
		defined( 'JETPACK__ERRORS_PUBLIC_KEY' ) || define( 'JETPACK__ERRORS_PUBLIC_KEY', 'KdZY80axKX+nWzfrOcizf0jqiFHnrWCl9X8yuaClKgM=' );

		add_action( 'rest_api_init', array( $this, 'register_verify_error_endpoint' ) );
	}

	/**
	 * Gets the instance of this singleton class
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
	 * Keep track of a connection error that was encoutered
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
	 * @param \WP_Error $error the error object.
	 * @return boolean $should_report True if gate is open and the error should be reported.
	 */
	public function should_report_error( \WP_Error $error ) {

		if ( defined( 'JETPACK_DEV_DEBUG' ) && JETPACK_DEV_DEBUG ) {
			return true;
		}

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
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if error is invalid or the error array
	 */
	public function wp_error_to_array( \WP_Error $error ) {

		$data       = $error->get_error_data();
		$error_code = $error->get_error_code();

		if ( ! isset( $data['signature_details'] ) || ! is_array( $data['signature_details'] ) ) {
			return false;
		}

		$data = $data['signature_details'];

		if ( ! isset( $data['token'] ) || empty( $data['token'] ) ) {
			return false;
		}

		$user_id = $this->get_user_id_from_token( $data['token'] );

		$error_array = array(
			'error_code'    => $error_code,
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
	 * @param array $error_array The array representation of the error as it is stored in the database.
	 * @return bool
	 */
	public function send_error_to_wpcom( $error_array ) {

		$blog_id = \Jetpack_Options::get_option( 'id' );

		$encrypted_data = $this->encrypt_data_to_wpcom( $error_array );

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
	 * @return array $errors
	 */
	public function get_stored_errors() {
		// todo: add object cache.
		// todo: garbage collector, delete old unverified errors based on timestamp.
		$stored_errors = get_option( self::STORED_ERRORS_OPTION );
		if ( ! is_array( $stored_errors ) ) {
			$stored_errors = array();
		}
		return $stored_errors;
	}

	/**
	 * Gets the verified errors stored in the database
	 *
	 * @return array $errors
	 */
	public function get_verified_errors() {
		$verified_errors = get_option( self::STORED_VERIFIED_ERRORS_OPTION );
		if ( ! is_array( $verified_errors ) ) {
			$verified_errors = array();
		}
		return $verified_errors;
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_stored_errors() {
		return delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Delete the verified errors stored in the database
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_verified_errors() {
		return delete_option( self::STORED_VERIFIED_ERRORS_OPTION );
	}

	/**
	 * Gets an error based on the nonce
	 *
	 * Receives a nonce and finds the related error. If error is found, move it to the verified errors option.
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
