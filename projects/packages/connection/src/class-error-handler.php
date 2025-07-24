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
 * This class handles the following workflow for incoming XML-RPC and REST API requests:
 *
 * 1. An incoming XML-RPC or REST API request with an invalid signature triggers an error
 * 2. Applies a gate to only process each error code once an hour to avoid overflow
 * 3. It stores the error on the database, but we don't know yet if this is a valid error, because
 *    we can't confirm it came from WP.com.
 * 4. It encrypts the error details and sends it to the wp.com server
 * 5. wp.com checks it and, if valid, sends a new request back to this site using the verify_xml_rpc_error REST endpoint
 * 6. This endpoint adds this error to the Verified errors in the database
 * 7. Triggers a workflow depending on the error (display user an error message, do some self healing, etc.)
 *
 * Note: This class only handles authentication/signature errors from incoming requests to this site.
 * Outgoing request signing issues (when this site makes requests to WP.com) are not handled here.
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
 * A user ID can be:
 * * 0 for blog tokens
 * * positive integer for user tokens
 * * 'invalid' for malformed tokens
 *
 * Example error structure:
 * [
 *   'invalid_token' => [
 *     '123' => [
 *       'error_code' => 'invalid_token',
 *       'user_id' => '123',
 *       'error_message' => 'The token is invalid',
 *       'error_data' => ['action' => 'reconnect'],
 *       'timestamp' => 1234567890,
 *       'nonce' => 'abc123def',
 *       'error_type' => 'xmlrpc'
 *     ]
 *   ]
 * ]
 *
 * @since 1.14.2
 */
class Error_Handler {

	/**
	 * The name of the option that stores the errors
	 *
	 * @since 1.14.2
	 *
	 * @var string
	 */
	const STORED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_errors';

	/**
	 * The name of the option that stores the errors
	 *
	 * @since 1.14.2
	 *
	 * @var string
	 */
	const STORED_VERIFIED_ERRORS_OPTION = 'jetpack_connection_xmlrpc_verified_errors';

	/**
	 * The prefix of the transient that controls the gate for each error code
	 *
	 * @since 1.14.2
	 *
	 * @var string
	 */
	const ERROR_REPORTING_GATE = 'jetpack_connection_error_reporting_gate_';

	/**
	 * Time in seconds a test should live in the database before being discarded
	 *
	 * @since 1.14.2
	 */
	const ERROR_LIFE_TIME = DAY_IN_SECONDS;

	/**
	 * List of known errors. Only error codes in this list will be handled
	 *
	 * @since 1.14.2
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
		'no_valid_user_token',
		'no_valid_blog_token',
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
		'invalid_connection_owner',
	);

	/**
	 * Holds the instance of this singleton class
	 *
	 * @since 1.14.2
	 *
	 * @var Error_Handler $instance
	 */
	public static $instance = null;

	/**
	 * Cached displayable errors to avoid duplicate processing
	 *
	 * @since 6.13.10
	 *
	 * @var array|null
	 */
	private $cached_displayable_errors = null;

	/**
	 * Initialize instance, hooks and load verified errors handlers
	 *
	 * @since 1.14.2
	 */
	private function __construct() {
		defined( 'JETPACK__ERRORS_PUBLIC_KEY' ) || define( 'JETPACK__ERRORS_PUBLIC_KEY', 'KdZY80axKX+nWzfrOcizf0jqiFHnrWCl9X8yuaClKgM=' );

		add_action( 'rest_api_init', array( $this, 'register_verify_error_endpoint' ) );

		// Handle verified errors on admin pages.
		add_action( 'admin_init', array( $this, 'handle_verified_errors' ) );

		// If the site gets reconnected, clear errors.
		add_action( 'jetpack_site_registered', array( $this, 'delete_all_errors' ) );
		add_action( 'jetpack_get_site_data_success', array( $this, 'delete_all_api_errors' ) );
		add_filter( 'jetpack_connection_disconnect_site_wpcom', array( $this, 'delete_all_errors_and_return_unfiltered_value' ) );
		add_filter( 'jetpack_connection_delete_all_tokens', array( $this, 'delete_all_errors_and_return_unfiltered_value' ) );
		add_action( 'jetpack_unlinked_user', array( $this, 'delete_all_errors' ) );
		add_action( 'jetpack_updated_user_token', array( $this, 'delete_all_errors' ) );
	}

	/**
	 * Gets displayable errors with predefined structure and optional filtering.
	 *
	 * This method returns a hierarchical array of errors (error_code => user_id => error_details)
	 * that can be safely displayed in My Jetpack and other UI components. It includes
	 * predefined error messages and actions, with optional filtering for specific sites.
	 * Only processes a limited set of error codes that are meant to be displayed to users.
	 *
	 * @since 6.13.10
	 *
	 * @return array Array of displayable errors with hierarchical structure.
	 *               Example:
	 *               [
	 *                 'invalid_token' => [
	 *                   '123' => [
	 *                     'error_code' => 'invalid_token',
	 *                     'user_id' => '123',
	 *                     'error_message' => 'Your connection with WordPress.com seems to be broken...',
	 *                     'error_data' => ['action' => 'reconnect'],
	 *                     'timestamp' => 1234567890,
	 *                     'nonce' => 'abc123def',
	 *                     'error_type' => 'xmlrpc'
	 *                   ]
	 *                 ]
	 *               ]
	 */
	public function get_displayable_errors() {
		// Check if we have cached result AND no filters are applied
		if ( $this->cached_displayable_errors !== null && ! $this->has_external_filters() ) {
			return $this->cached_displayable_errors;
		}

		$verified_errors    = $this->get_verified_errors();
		$displayable_errors = array();

		// Only process error codes that are meant to be displayed to users
		$displayable_error_codes = array(
			'malformed_token',
			'token_malformed',
			'no_possible_tokens',
			'no_valid_user_token',
			'no_valid_blog_token',
			'unknown_token',
			'could_not_sign',
			'invalid_token',
			'token_mismatch',
			'invalid_signature',
			'signature_mismatch',
			'no_user_tokens',
			'no_token_for_user',
			'invalid_connection_owner',
		);

		foreach ( $verified_errors as $error_code => $users ) {
			// Skip error codes that are not meant to be displayed
			if ( ! in_array( $error_code, $displayable_error_codes, true ) ) {
				continue;
			}

			$displayable_errors[ $error_code ] = array();

			foreach ( $users as $user_id => $error ) {
				// Override other error messages with default display message
				$displayable_errors[ $error_code ][ $user_id ] = array_merge(
					$error,
					array(
						'error_message' => __( "Your connection with WordPress.com seems to be broken. If you're experiencing issues, please try reconnecting.", 'jetpack-connection' ),
					)
				);
			}
		}

		/**
		 * Filter displayable connection errors to allow customization of error messages and actions.
		 *
		 * This filter allows sites to customize how connection errors are displayed,
		 * including modifying error messages, actions, and data. Access to this filter
		 * is controlled by should_allow_error_filtering().
		 *
		 * @since 6.12.0
		 *
		 * @param array $displayable_errors Array of displayable errors with hierarchical structure.
		 * @param array $verified_errors    Array of raw verified errors from the database.
		 */
		if ( $this->should_allow_error_filtering() ) {
			$displayable_errors = apply_filters( 'jetpack_connection_get_verified_errors', $displayable_errors, $verified_errors );
		}

		// Only cache if no external filters are applied
		if ( ! $this->has_external_filters() ) {
			$this->cached_displayable_errors = $displayable_errors;
		}

		return $displayable_errors;
	}

	/**
	 * Sets up hooks for displaying verified errors on admin pages.
	 *
	 * This method is hooked into 'admin_init'. It retrieves displayable errors
	 * and, if any exist, sets up the necessary action and filter hooks to display
	 * them in admin notices and the React dashboard.
	 *
	 * @since 1.14.2
	 */
	public function handle_verified_errors() {
		$displayable_errors = $this->get_displayable_errors();

		// If there are any displayable errors, set up the hooks for displaying them in React dashboard and admin notices.
		if ( ! empty( $displayable_errors ) ) {
			add_action( 'admin_notices', array( $this, 'generic_admin_notice_error' ) );
			add_filter( 'react_connection_errors_initial_state', array( $this, 'jetpack_react_dashboard_error' ), 10, 1 );
		}
	}

	/**
	 * Determines whether error filtering should be allowed.
	 *
	 * This method controls access to the jetpack_connection_displayable_errors filter.
	 * Currently, only WoA sites are allowed to use this filter.
	 *
	 * @since 6.13.10
	 *
	 * @return bool True if error filtering should be allowed, false otherwise.
	 */
	protected function should_allow_error_filtering() {
		$host = new \Automattic\Jetpack\Status\Host();
		return $host->is_woa_site();
	}

	/**
	 * Provides displayable connection errors for the React dashboard in a flat array format.
	 *
	 * This method transforms the hierarchical displayable_errors structure into the flat format
	 * expected by the React dashboard. It's used as a filter for 'react_connection_errors_initial_state'.
	 * Returns only the first error to avoid overwhelming the user with multiple error messages.
	 *
	 * @since 8.9.0
	 *
	 * @param array $errors Existing errors from other filters (unused but required for filter signature).
	 * @return array Array containing only the first displayable error for the React dashboard.
	 *               Example:
	 *               [
	 *                 [
	 *                   'code' => 'connection_error',
	 *                   'message' => 'Your connection with WordPress.com seems to be broken...',
	 *                   'action' => 'reconnect',
	 *                   'data' => [
	 *                     'api_error_code' => 'invalid_token',
	 *                     'action' => 'reconnect'
	 *                   ]
	 *                 ]
	 *               ]
	 */
	public function jetpack_react_dashboard_error( $errors ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$displayable_errors = $this->get_displayable_errors();

		// Get the first error only
		$first_error_code = array_key_first( $displayable_errors );
		if ( ! $first_error_code ) {
			return array(); // No errors
		}

		$first_user_errors = $displayable_errors[ $first_error_code ];
		if ( ! is_array( $first_user_errors ) || empty( $first_user_errors ) ) {
			return array(); // Invalid error structure
		}

		$first_error = reset( $first_user_errors );

		// Validate error structure
		if ( ! is_array( $first_error ) || ! isset( $first_error['error_message'] ) ) {
			return array(); // Invalid error structure
		}

		// Determine the action - use the one from error_data if available, otherwise default to 'reconnect'
		$action = 'reconnect'; // Default action for connection errors
		if ( isset( $first_error['error_data']['action'] ) && is_string( $first_error['error_data']['action'] ) ) {
			$action = $first_error['error_data']['action'];
		}

		// Safely merge error data, ensuring we don't overwrite critical fields
		$error_data = isset( $first_error['error_data'] ) && is_array( $first_error['error_data'] ) ? $first_error['error_data'] : array();

		// Build the data array with safe merging
		$dashboard_data = array( 'api_error_code' => $first_error_code );

		// Add error_data fields, but be careful not to overwrite api_error_code
		foreach ( $error_data as $key => $value ) {
			if ( 'api_error_code' !== $key ) {
				$dashboard_data[ $key ] = $value;
			}
		}

		$dashboard_error = array(
			array(
				'code'    => 'connection_error',
				'message' => $first_error['error_message'],
				'action'  => $action,
				'data'    => $dashboard_data,
			),
		);

		return $dashboard_error;
	}

	/**
	 * Gets the instance of this singleton class
	 *
	 * @since 1.14.2
	 *
	 * @return Error_Handler $instance
	 */
	public static function get_instance() {
		if ( self::$instance === null ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Keep track of a connection error that was encountered
	 *
	 * @param \WP_Error $error  The error object.
	 * @param boolean   $force  Force the report, even if should_report_error is false.
	 * @param boolean   $skip_wpcom_verification Set to 'true' to verify the error locally and skip the WP.com verification.
	 *
	 * @return void
	 * @since 1.14.2
	 */
	public function report_error( \WP_Error $error, $force = false, $skip_wpcom_verification = false ) {
		if ( in_array( $error->get_error_code(), $this->known_errors, true ) && ( $this->should_report_error( $error ) || $force ) ) {
			$stored_error = $this->store_error( $error );
			if ( $stored_error ) {
				$skip_wpcom_verification ? $this->verify_error( $stored_error ) : $this->send_error_to_wpcom( $stored_error );
			}
		}
	}

	/**
	 * Checks the status of the gate
	 *
	 * This protects the site (and WPCOM) against over loads.
	 *
	 * @since 1.14.2
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean $should_report True if gate is open and the error should be reported.
	 */
	public function should_report_error( \WP_Error $error ) {
		if ( defined( '\\JETPACK_DEV_DEBUG' ) && constant( '\\JETPACK_DEV_DEBUG' ) ) {
			return true;
		}

		/**
		 * Whether to bypass the gate for the error handling
		 *
		 * By default, we only process errors once an hour for each error code.
		 * This is done to avoid overflows. If you need to disable this gate, you can set this variable to true.
		 *
		 * This filter is useful for unit testing
		 *
		 * @since 1.14.2
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
	 * @since 1.14.2
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
		$error_code_count = is_countable( $stored_errors[ $error_code ] ) ? count( $stored_errors[ $error_code ] ) : 0;
		if ( $error_code_count > 5 ) {
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
	 * Builds action error data for generic JavaScript components.
	 *
	 * This helper method creates standardized error_data arrays that work with the generic
	 * JavaScript error handling components. External plugins (like wpcomsh) can use this
	 * to ensure their error structures are compatible.
	 *
	 * @since 6.16.0
	 *
	 * @param array $args Action configuration arguments - only non-empty values will be included.
	 * @return array Standardized error_data array for JavaScript components.
	 */
	public function build_action_error_data( array $args = array() ) {
		// Set default values for variants
		$args = wp_parse_args(
			$args,
			array(
				'action_variant'           => 'primary',
				'secondary_action_variant' => 'secondary',
			)
		);

		// Start with core data
		$error_data = array(
			'blog_id' => \Jetpack_Options::get_option( 'id' ),
		);

		// Validate variant values
		$valid_variants = array( 'primary', 'secondary' );
		if ( ! in_array( $args['action_variant'], $valid_variants, true ) ) {
			$args['action_variant'] = 'primary';
		}
		if ( ! in_array( $args['secondary_action_variant'], $valid_variants, true ) ) {
			$args['secondary_action_variant'] = 'secondary';
		}

		// Merge extra_data first, then regular args (so args take precedence)
		if ( ! empty( $args['extra_data'] ) && is_array( $args['extra_data'] ) ) {
			$error_data = array_merge( $error_data, $args['extra_data'] );
			unset( $args['extra_data'] ); // Remove from args to avoid duplication
		}

		// Filter out empty values and merge with error_data
		$filtered_args = array_filter(
			$args,
			function ( $value ) {
				return ! empty( $value );
			}
		);

		return array_merge( $error_data, $filtered_args );
	}

	/**
	 * Builds a standardized error array for the connection error system.
	 *
	 * This method creates a consistent error array structure that can be used
	 * by both internal error handling and external plugins/customizations.
	 *
	 * @since 1.14.2
	 *
	 * @param string $error_code    The error code identifier.
	 * @param string $error_message The human-readable error message.
	 * @param array  $error_data    Additional error data (optional).
	 * @param string $user_id       The user ID associated with the error (optional).
	 * @param string $error_type    The type of error (optional).
	 * @return array|false The standardized error array or false on failure.
	 *                     Example successful return:
	 *                     [
	 *                       'error_code' => 'invalid_token',
	 *                       'user_id' => '123',
	 *                       'error_message' => 'The token is invalid',
	 *                       'error_data' => ['action' => 'reconnect'],
	 *                       'timestamp' => 1234567890,
	 *                       'nonce' => 'abc123def',
	 *                       'error_type' => 'xmlrpc'
	 *                     ]
	 */
	public function build_error_array( string $error_code, string $error_message, array $error_data = array(), $user_id = '0', string $error_type = '' ) {
		// Validate required parameters
		if ( empty( $error_code ) || empty( $error_message ) ) {
			return false;
		}

		// Validate user_id is a string or integer
		if ( ! is_string( $user_id ) && ! is_int( $user_id ) ) {
			return false;
		}

		return array(
			'error_code'    => $error_code,
			'user_id'       => $user_id,
			'error_message' => $error_message,
			'error_data'    => $error_data,
			'timestamp'     => time(),
			'nonce'         => wp_generate_password( 10, false ),
			'error_type'    => $error_type,
		);
	}

	/**
	 * Converts a WP_Error object in the array representation we store in the database
	 *
	 * @since 1.14.2
	 *
	 * @param \WP_Error $error the error object.
	 * @return boolean|array False if error is invalid or the error array
	 */
	public function wp_error_to_array( \WP_Error $error ) {

		$data = $error->get_error_data();

		if ( ! isset( $data['signature_details'] ) || ! is_array( $data['signature_details'] ) ) {
			return false;
		}

		$signature_details = $data['signature_details'];

		if ( ! isset( $signature_details['token'] ) ) {
			return false;
		}

		$user_id = $this->get_user_id_from_token( $signature_details['token'] );

		return $this->build_error_array(
			$error->get_error_code(),
			$error->get_error_message(),
			$signature_details,
			$user_id,
			empty( $data['error_type'] ) ? '' : $data['error_type']
		);
	}

	/**
	 * Sends the error to WP.com to be verified
	 *
	 * @since 1.14.2
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
	 * @since 1.14.2
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
	 * @since 1.14.2
	 *
	 * @param string $token the token used to make the request.
	 * @return string $the user id or `invalid` if user id not present.
	 */
	public function get_user_id_from_token( $token ) {
		$user_id = 'invalid';

		if ( $token ) {
			$parsed_token = explode( ':', wp_unslash( $token ) );

			if ( isset( $parsed_token[2] ) && ctype_digit( $parsed_token[2] ) ) {
				$user_id = $parsed_token[2];
			}
		}

		return $user_id;
	}

	/**
	 * Gets the reported errors stored in the database
	 *
	 * @since 1.14.2
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
	 * Gets the verified errors stored in the database.
	 *
	 * This method retrieves only the errors that are actually stored in the database,
	 * without applying any filters that might inject additional errors. This is used
	 * internally by methods that need to modify and store the verified errors back
	 * to the database to prevent accidentally persisting filtered/injected errors.
	 *
	 * @since 1.14.2
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
	 * expired error will be permanently removed from the database
	 *
	 * @since 1.14.2
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
			function ( $user_errors ) {
				return ! empty( $user_errors );
			}
		);
		return $errors;
	}

	/**
	 * Delete all stored and verified errors from the database
	 *
	 * @since 1.14.2
	 *
	 * @return void
	 */
	public function delete_all_errors() {
		$this->delete_stored_errors();
		$this->delete_verified_errors();

		// Invalidate cache since we deleted all errors
		$this->invalidate_displayable_errors_cache();
	}

	/**
	 * Delete all stored and verified API errors from the database, leave the non-API errors intact.
	 *
	 * @since 1.54.0
	 *
	 * @return void
	 */
	public function delete_all_api_errors() {
		$type_filter = function ( $errors ) {
			if ( is_array( $errors ) ) {
				foreach ( $errors as $key => $error ) {
					if ( ! empty( $error['error_type'] ) && in_array( $error['error_type'], array( 'xmlrpc', 'rest' ), true ) ) {
						unset( $errors[ $key ] );
					}
				}
			}

			return count( $errors ) ? $errors : null;
		};

		$stored_errors = $this->get_stored_errors();
		if ( is_array( $stored_errors ) && count( $stored_errors ) ) {
			$stored_errors = array_filter( array_map( $type_filter, $stored_errors ) );
			if ( count( $stored_errors ) ) {
				update_option( static::STORED_ERRORS_OPTION, $stored_errors );
			} else {
				delete_option( static::STORED_ERRORS_OPTION );
			}
		}

		$verified_errors = $this->get_verified_errors();
		if ( is_array( $verified_errors ) && count( $verified_errors ) ) {
			$verified_errors = array_filter( array_map( $type_filter, $verified_errors ) );
			if ( count( $verified_errors ) ) {
				update_option( static::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );
			} else {
				delete_option( static::STORED_VERIFIED_ERRORS_OPTION );
			}
		}

		// Invalidate cache since we may have deleted verified errors
		$this->invalidate_displayable_errors_cache();
	}

	/**
	 * Delete all stored and verified errors from the database and returns unfiltered value
	 *
	 * This is used to hook into a couple of filters that expect true to not short circuit the disconnection flow
	 *
	 * @since 8.9.0
	 *
	 * @param mixed $check The input sent by the filter.
	 * @return boolean
	 */
	public function delete_all_errors_and_return_unfiltered_value( $check ) {
		$this->delete_all_errors();
		return $check;
	}

	/**
	 * Delete the reported errors stored in the database
	 *
	 * @since 1.14.2
	 *
	 * @return boolean True, if option is successfully deleted. False on failure.
	 */
	public function delete_stored_errors() {
		return delete_option( self::STORED_ERRORS_OPTION );
	}

	/**
	 * Delete the verified errors stored in the database
	 *
	 * @since 1.14.2
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
	 * @since 1.14.2
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
	 * @since 1.14.2
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

		// Invalidate cache since we added a new verified error
		$this->invalidate_displayable_errors_cache();
	}

	/**
	 * Register REST API end point for error handling.
	 *
	 * @since 1.14.2
	 *
	 * @return void
	 */
	public function register_verify_error_endpoint() {
		register_rest_route(
			'jetpack/v4',
			'/verify_xmlrpc_error',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'verify_xml_rpc_error' ),
				'permission_callback' => '__return_true',
				'args'                => array(
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
	 * @since 1.14.2
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

	/**
	 * Prints a generic error notice for all connection errors
	 *
	 * @since 8.9.0
	 *
	 * @return void
	 */
	public function generic_admin_notice_error() {
		// do not add admin notice to the jetpack dashboard.
		global $pagenow;
		if ( 'admin.php' === $pagenow || isset( $_GET['page'] ) && 'jetpack' === $_GET['page'] ) { // phpcs:ignore
			return;
		}

		if ( ! current_user_can( 'jetpack_connect' ) ) {
			return;
		}

		/**
		 * Filters the message to be displayed in the admin notices area when there's a connection error.
		 *
		 * By default  we don't display any errors.
		 *
		 * Return an empty value to disable the message.
		 *
		 * @since 8.9.0
		 *
		 * @param string $message The error message.
		 * @param array  $errors The array of errors. See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		 */
		$message = apply_filters( 'jetpack_connection_error_notice_message', '', $this->get_displayable_errors() );

		/**
		 * Fires inside the admin_notices hook just before displaying the error message for a broken connection.
		 *
		 * If you want to disable the default message from being displayed, return an empty value in the jetpack_connection_error_notice_message filter.
		 *
		 * @since 8.9.0
		 *
		 * @param array $errors The array of errors. See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		 */
		do_action( 'jetpack_connection_error_notice', $this->get_displayable_errors() );

		if ( empty( $message ) ) {
			return;
		}

		wp_admin_notice(
			esc_html( $message ),
			array(
				'type'               => 'error',
				'dismissible'        => true,
				'additional_classes' => array( 'jetpack-message', 'jp-connect' ),
				'attributes'         => array( 'style' => 'display:block !important;' ),
			)
		);
	}

	/**
	 * Check REST API response for errors, and report them to WP.com if needed.
	 *
	 * @see wp_remote_request() For more information on the $http_response array format.
	 * @param array|\WP_Error $http_response The response or WP_Error on failure.
	 * @param array           $auth_data Auth data, allowed keys: `token`, `timestamp`, `nonce`, `body-hash`.
	 * @param string          $url Request URL.
	 * @param string          $method Request method.
	 * @param string          $error_type The source of an error: 'xmlrpc' or 'rest'.
	 *
	 * @return void
	 */
	public function check_api_response_for_errors( $http_response, $auth_data, $url, $method, $error_type ) {
		if ( 200 === wp_remote_retrieve_response_code( $http_response ) || ! is_array( $auth_data ) || ! $url || ! $method ) {
			return;
		}

		$body_raw = wp_remote_retrieve_body( $http_response );
		if ( ! $body_raw ) {
			return;
		}

		$body = json_decode( $body_raw, true );
		if ( empty( $body['error'] ) || ( ! is_string( $body['error'] ) && ! is_int( $body['error'] ) ) ) {
			return;
		}

		$error = new \WP_Error(
			$body['error'],
			empty( $body['message'] ) ? '' : $body['message'],
			array(
				'signature_details' => array(
					'token'     => empty( $auth_data['token'] ) ? '' : $auth_data['token'],
					'timestamp' => empty( $auth_data['timestamp'] ) ? '' : $auth_data['timestamp'],
					'nonce'     => empty( $auth_data['nonce'] ) ? '' : $auth_data['nonce'],
					'body_hash' => empty( $auth_data['body_hash'] ) ? '' : $auth_data['body_hash'],
					'method'    => $method,
					'url'       => $url,
				),
				'error_type'        => in_array( $error_type, array( 'xmlrpc', 'rest' ), true ) ? $error_type : '',
			)
		);

		$this->report_error( $error, false, true );
	}

	/**
	 * Determines whether external filters are applied to the get_displayable_errors method.
	 *
	 * @since 6.13.10
	 *
	 * @return bool True if external filters are applied, false otherwise.
	 */
	private function has_external_filters() {
		return has_filter( 'jetpack_connection_get_verified_errors' ) && $this->should_allow_error_filtering();
	}

	/**
	 * Invalidates the cached displayable errors
	 *
	 * @since 6.13.10
	 *
	 * @return void
	 */
	private function invalidate_displayable_errors_cache() {
		$this->cached_displayable_errors = null;
	}
}
