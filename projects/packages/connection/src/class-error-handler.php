<?php
/**
 * The Jetpack Connection error class file.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The Jetpack Connection error handler.
 *
 * This class stores and surfaces connection (authentication/signature) errors for requests
 * in both directions: incoming (WP.com to this site) and outgoing (this site to WP.com).
 *
 * Flow 1 — incoming request errors. Entry point: `report_error()`.
 *
 * 1. An incoming XML-RPC or REST API request with an invalid signature triggers an error in
 *    `Manager::verify_xml_rpc_signature()`, which reports it here. (Signed incoming REST
 *    requests are funneled into the same verification path by `REST_Authentication`.)
 * 2. Applies a gate to only process each error code once an hour to avoid overflow
 * 3. It stores the error on the database, but we don't know yet if this is a valid error, because
 *    we can't confirm it came from WP.com.
 * 4. It encrypts the error details and sends it to the wp.com server
 * 5. wp.com checks it and, if valid, sends a new request back to this site using the verify_xml_rpc_error REST endpoint
 * 6. This endpoint adds this error to the Verified errors in the database
 * 7. Triggers a workflow depending on the error (display user an error message, do some self healing, etc.)
 *
 * Flow 2 — outgoing request errors. Entry point: `check_api_response_for_errors()`.
 *
 * 1. Every signed request made through `Client::remote_request()` has its response checked
 *    by `check_api_response_for_errors()`.
 * 2. When the response carries a known error code, the error is stored and immediately
 *    marked verified (the same hourly gate applies). The WP.com verification round-trip of
 *    flow 1 is skipped because the error arrived in a response to a request this site
 *    itself initiated and signed — the failed response is its own evidence.
 *
 * Stored errors carry two orthogonal classification fields:
 *
 * - `error_type` — the transport/source of the failed request: 'xmlrpc', 'rest',
 *   'local_state' (local connection-state errors involving no request at all, e.g.
 *   `invalid_connection_owner`; stored as 'connection' by package versions <= 8.8),
 *   or '' for entries stored by older package versions.
 * - `error_direction` — 'incoming', 'outgoing', or '' (legacy entries and
 *   'local_state'-type errors, which have no direction).
 *
 * Note on naming: both option names below contain "xmlrpc" because they predate REST
 * support. They are intentionally kept as-is to avoid a data migration and breaking
 * consumers that read the options directly — despite the names, they store errors of
 * every type and direction.
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
 *       'error_type' => 'xmlrpc',
 *       'error_direction' => 'incoming'
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
	 * `error_type` value for errors from XML-RPC requests.
	 *
	 * @since 8.9.0
	 *
	 * @var string
	 */
	const ERROR_TYPE_XMLRPC = 'xmlrpc';

	/**
	 * `error_type` value for errors from REST requests.
	 *
	 * @since 8.9.0
	 *
	 * @var string
	 */
	const ERROR_TYPE_REST = 'rest';

	/**
	 * `error_type` value for local connection-state errors that involve no request,
	 * e.g. `invalid_connection_owner`. The evidence for these errors is the site's own
	 * database, which is also why they carry no `error_direction`.
	 *
	 * Note: package versions <= 8.8 stored these errors with the type 'connection'.
	 *
	 * @since 8.9.0
	 *
	 * @var string
	 */
	const ERROR_TYPE_LOCAL_STATE = 'local_state';

	/**
	 * `error_direction` value for errors triggered by incoming requests (WP.com to this site).
	 *
	 * @since 8.9.0
	 *
	 * @var string
	 */
	const DIRECTION_INCOMING = 'incoming';

	/**
	 * `error_direction` value for errors triggered by outgoing requests (this site to WP.com).
	 *
	 * @since 8.9.0
	 *
	 * @var string
	 */
	const DIRECTION_OUTGOING = 'outgoing';

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
		// Incoming request token problems (Manager::internal_verify_xml_rpc_signature).
		'malformed_token',           // Token in the request is empty/garbled, or its API version doesn't match ours.
		'malformed_user_id',         // The user_id segment of the request token is not numeric.
		'unknown_user',              // The request token's user does not exist on this site.
		// Locally stored token problems (Tokens::get_access_token).
		'no_user_tokens',            // The user_tokens option is empty; no user tokens exist at all.
		'empty_master_user_option',  // The owner's token was requested but the master_user option is empty.
		'no_token_for_user',         // No stored token for the requested user.
		'token_malformed',           // The stored token for the requested user is corrupt (missing chunks).
		'user_id_mismatch',          // The requested user ID doesn't match the user_id segment of their stored token.
		'no_possible_tokens',        // No stored blog token.
		'no_valid_user_token',       // The stored user token doesn't match the key the request was signed with.
		'no_valid_blog_token',       // The stored blog token doesn't match the key the request was signed with.
		'unknown_token',             // No stored token matches the request token's key.
		// Signature verification problems (Jetpack_Signature), or errors WPCOM returned
		// for an outbound request (Error_Handler::check_api_response_for_errors).
		'could_not_sign',            // Signing the request failed for an unknown reason.
		'invalid_scheme',            // Invalid URL scheme when signing.
		'invalid_secret',            // The stored token secret is invalid.
		'invalid_token',             // No token available when signing; from WPCOM: the token used was rejected.
		'token_mismatch',            // The request token doesn't match the token we hold.
		'invalid_body',              // The request body is malformed.
		'invalid_signature',         // A signature parameter is malformed, or the timestamp is off (clock skew).
		'invalid_body_hash',         // The body hash doesn't match the request body.
		'invalid_nonce',             // The request nonce could not be added (likely a reuse/replay).
		'signature_mismatch',        // Computed signature differs: wrong secret, or URL/body drift (domain change, proxy).
		// Connection state problems (Manager::get_connection_owner).
		'invalid_connection_owner',  // The connection owner cannot be resolved: token missing or WP user deleted.
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
	 * error_data.action is only set when it deviates from the default behavior
	 * (e.g. 'none' to suppress the reconnect CTA); when absent, readers fall back
	 * to offering the reconnect CTA.
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
	 *                     'audience' => 'user',
	 *                     'error_data' => [...],
	 *                     'timestamp' => 1234567890,
	 *                     'nonce' => 'abc123def',
	 *                     'error_type' => 'xmlrpc'
	 *                   ]
	 *                 ]
	 *               ]
	 */
	public function get_displayable_errors() {
		$viewer_id = get_current_user_id();

		// Check if we have a cached result for this viewer AND no filters are applied.
		// The output is viewer-dependent (see audience classification below), so the
		// cache is keyed by the current user.
		if ( is_array( $this->cached_displayable_errors )
			&& array_key_exists( $viewer_id, $this->cached_displayable_errors )
			&& ! $this->has_external_filters() ) {
			return $this->cached_displayable_errors[ $viewer_id ];
		}

		$verified_errors    = $this->get_verified_errors();
		$displayable_errors = array();

		// The common case is zero verified errors: skip the owner/transferability
		// lookups entirely then. The external filter below still runs so consumers
		// (e.g. wpcomsh) can inject errors into an empty set.
		if ( ! empty( $verified_errors ) ) {
			// Only process error codes that are meant to be displayed to users.
			// `no_user_tokens` is deliberately excluded: with an empty user_tokens option the
			// site already behaves as site-only connected, and the connection UI prompts users
			// to connect their accounts. The owner flavor is covered by `invalid_connection_owner`.
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
				'no_token_for_user',
				'invalid_connection_owner',
			);

			$owner_id        = (int) \Jetpack_Options::get_option( 'master_user' );
			$viewer_is_owner = $owner_id > 0 && $viewer_id === $owner_id;
			$is_transferable = ( new Manager() )->is_ownership_transferable();

			foreach ( $verified_errors as $error_code => $users ) {
				// Skip error codes that are not meant to be displayed
				if ( ! in_array( $error_code, $displayable_error_codes, true ) ) {
					continue;
				}

				foreach ( $users as $user_id => $error ) {
					// An error that cannot be attributed to the blog token or to any user's
					// token belongs to no audience and is not actionable by any viewer.
					if ( 'invalid' === $user_id ) {
						continue;
					}

					$audience = $this->classify_error_audience( $user_id, $owner_id );

					$message = __( "Your connection with WordPress.com seems to be broken. If you're experiencing issues, please try reconnecting.", 'jetpack-connection' );
					$action  = null;

					// A secondary admin looking at the connection owner's token error, on a
					// site where ownership is locked (a consumer declared it non-transferable).
					// This admin cannot resolve the error themselves, so surface an
					// informational notice naming the owner and offer no reconnect CTA.
					if ( 'owner' === $audience && ! $viewer_is_owner && ! $is_transferable ) {
						// Only name the owner for viewers who can act on connection issues:
						// this output is also printed into the initial state for
						// lower-capability users (e.g. contributors in the editor), who
						// shouldn't learn who owns the connection. The name is resolved from
						// the local user rather than get_connection_owner(), which
						// re-reports the error and fails exactly when the token is broken.
						$owner_name = '';
						if ( current_user_can( 'jetpack_connect' ) ) {
							$owner      = get_userdata( $owner_id );
							$owner_name = $owner instanceof \WP_User ? $owner->display_name : '';
						}

						$message = $owner_name
							? sprintf(
								/* translators: %s is the display name of the Jetpack connection owner. */
								__( 'The connection owner (%s) needs to reconnect their WordPress.com account to restore the connection.', 'jetpack-connection' ),
								$owner_name
							)
							: __( 'The connection owner needs to reconnect their WordPress.com account to restore the connection.', 'jetpack-connection' );
						$action = 'none';
					}

					$error['audience']      = $audience;
					$error['error_message'] = $message;

					// Only emit error_data.action when it deviates from the default. Readers
					// already fall back to the reconnect CTA when no action is set, and
					// injecting an explicit 'reconnect' could trip consumer code paths
					// reserved for custom actions.
					if ( null !== $action ) {
						$error_data           = ( isset( $error['error_data'] ) && is_array( $error['error_data'] ) ) ? $error['error_data'] : array();
						$error_data['action'] = $action;
						$error['error_data']  = $error_data;
					}

					if ( ! isset( $displayable_errors[ $error_code ] ) ) {
						$displayable_errors[ $error_code ] = array();
					}
					$displayable_errors[ $error_code ][ $user_id ] = $error;
				}
			}
		}

		/**
		 * Filter displayable connection errors to allow customization of error messages and actions.
		 *
		 * This filter allows sites to customize how connection errors are displayed,
		 * including modifying error messages, actions, and data. Access to this filter
		 * is controlled by should_allow_error_filtering().
		 *
		 * Consumer-injected errors take precedence over the default state. They are not
		 * required to carry the newer `audience` field: it is optional metadata used
		 * only for our own audience-aware messaging, and any reader must treat a missing
		 * value as site-wide (`$error['audience'] ?? 'site'`).
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
			if ( ! is_array( $this->cached_displayable_errors ) ) {
				$this->cached_displayable_errors = array();
			}
			$this->cached_displayable_errors[ $viewer_id ] = $displayable_errors;
		}

		return $displayable_errors;
	}

	/**
	 * Classifies the audience of a stored connection error based on its user ID.
	 *
	 * The audience determines who a connection error is relevant to and, in turn,
	 * how it should be surfaced:
	 * - `site`  : blog-token / site-wide errors (user ID `0`).
	 * - `owner` : errors tied to the connection owner's user token.
	 * - `user`  : errors tied to a specific (non-owner) user's token.
	 *
	 * Unattributable errors (user ID 'invalid') are skipped by the display pipeline
	 * before classification, so this method only receives numeric user IDs.
	 *
	 * @since 8.8.0
	 *
	 * @param string|int $user_id  The user ID associated with the error (`0` or a positive integer).
	 * @param int        $owner_id The local user ID of the connection owner, or 0 if there is none.
	 * @return string One of 'site', 'owner', or 'user'.
	 */
	private function classify_error_audience( $user_id, $owner_id ) {
		$user_id = (int) $user_id;

		if ( 0 === $user_id ) {
			return 'site';
		}

		if ( $owner_id > 0 && $user_id === $owner_id ) {
			return 'owner';
		}

		return 'user';
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
		if ( $host->is_woa_site() || $host->is_vip_site() || $host->is_newspack_site() ) {
			return true;
		}

		return false;
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
	 *                     'action' => 'reconnect',
	 *                     'audience' => 'site' // Who the error is relevant to: 'site', 'owner', or 'user'.
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

		// Expose the error audience (site/owner/user) so the dashboard can render
		// audience-aware copy. Falls back to site-wide for consumer-injected errors
		// that predate the audience field.
		$dashboard_data['audience'] = $first_error['audience'] ?? 'site';

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
	 * This is the entry point of the incoming-request error flow (flow 1 in the class
	 * docblock) when called with `$skip_wpcom_verification = false` (the default).
	 *
	 * Only error codes present in `$known_errors` are handled; anything else is
	 * silently discarded. The `WP_Error` must carry the data shape produced by
	 * `build_connection_error_data()`, or it is discarded as well.
	 *
	 * @param \WP_Error $error  The error object.
	 * @param boolean   $force  Force the report, even if should_report_error is false.
	 * @param boolean   $skip_wpcom_verification Set to 'true' to verify the error locally and skip the WP.com
	 *                  verification round-trip. Only do this when the error is self-evidencing — e.g. it came
	 *                  from a response WP.com sent to a request this site initiated (the outgoing flow), or
	 *                  from local connection state. Skipping verification for an incoming request error would
	 *                  let any unauthenticated requester plant a verified error and trigger its workflows
	 *                  (admin notices, self-healing), so leave it 'false' for anything derived from an
	 *                  incoming request.
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
	 * @since 8.9.0 Added the `$error_direction` parameter and output field.
	 *
	 * @param string $error_code      The error code identifier.
	 * @param string $error_message   The human-readable error message.
	 * @param array  $error_data      Additional error data (optional).
	 * @param string $user_id         The user ID associated with the error (optional).
	 * @param string $error_type      The type of error (optional). One of the `ERROR_TYPE_*` constants or ''.
	 * @param string $error_direction The direction of the request that triggered the error (optional).
	 *                                One of the `DIRECTION_*` constants or ''.
	 * @return array|false The standardized error array or false on failure.
	 *                     Example successful return:
	 *                     [
	 *                       'error_code' => 'invalid_token',
	 *                       'user_id' => '123',
	 *                       'error_message' => 'The token is invalid',
	 *                       'error_data' => ['action' => 'reconnect'],
	 *                       'timestamp' => 1234567890,
	 *                       'nonce' => 'abc123def',
	 *                       'error_type' => 'xmlrpc',
	 *                       'error_direction' => 'incoming'
	 *                     ]
	 */
	public function build_error_array( string $error_code, string $error_message, array $error_data = array(), $user_id = '0', string $error_type = '', string $error_direction = '' ) {
		// Validate required parameters
		if ( empty( $error_code ) || empty( $error_message ) ) {
			return false;
		}

		// Validate user_id is a string or integer
		if ( ! is_string( $user_id ) && ! is_int( $user_id ) ) {
			return false;
		}

		return array(
			'error_code'      => $error_code,
			'user_id'         => $user_id,
			'error_message'   => $error_message,
			'error_data'      => $error_data,
			'timestamp'       => time(),
			'nonce'           => wp_generate_password( 10, false ),
			'error_type'      => $error_type,
			'error_direction' => $error_direction,
		);
	}

	/**
	 * Builds the standardized `WP_Error` data payload for a connection error.
	 *
	 * This is the single place the error-data contract consumed by `wp_error_to_array()`
	 * is defined. Use it (or `build_connection_wp_error()`) instead of assembling the
	 * data array by hand, so every reporter produces the same shape:
	 *
	 * - `signature_details` is guaranteed to contain a `token` key (empty string when
	 *   the error is not tied to a specific token), which `wp_error_to_array()` requires.
	 *   The token is also what WP.com checks when verifying incoming-flow errors, so its
	 *   key must not be renamed.
	 * - `error_type` and `error_direction` are validated against the class constants and
	 *   stored as '' when the given value is not recognized. For 'local_state' errors the
	 *   direction is always forced to '' — they describe the site's own database, not a
	 *   request, so a direction would be meaningless and is ignored if passed.
	 * - `$extra` cannot override the reserved keys: `signature_details`, `error_type`,
	 *   and `error_direction` always win the merge.
	 *
	 * @since 8.9.0
	 *
	 * @param array  $signature_details Details of the signed request that failed: `token`,
	 *                                  and typically `timestamp`, `nonce`, `body_hash`,
	 *                                  `method`, `url`.
	 * @param string $error_type        One of the `ERROR_TYPE_*` constants.
	 * @param string $error_direction   One of the `DIRECTION_*` constants. Ignored for
	 *                                  'local_state' errors, which have no direction.
	 * @param array  $extra             Optional additional data, e.g. a `user_id` fallback for
	 *                                  errors whose token cannot be attributed to a user, or
	 *                                  `has_user_token` for `invalid_connection_owner`.
	 * @return array The error data array to pass as the third argument of `WP_Error`.
	 */
	public static function build_connection_error_data( array $signature_details, string $error_type, string $error_direction, array $extra = array() ) {
		$valid_types      = array( self::ERROR_TYPE_XMLRPC, self::ERROR_TYPE_REST, self::ERROR_TYPE_LOCAL_STATE );
		$valid_directions = array( self::DIRECTION_INCOMING, self::DIRECTION_OUTGOING );

		$error_type = in_array( $error_type, $valid_types, true ) ? $error_type : '';

		if ( self::ERROR_TYPE_LOCAL_STATE === $error_type ) {
			$error_direction = '';
		} else {
			$error_direction = in_array( $error_direction, $valid_directions, true ) ? $error_direction : '';
		}

		return array_merge(
			$extra,
			array(
				'signature_details' => array_merge( array( 'token' => '' ), $signature_details ),
				'error_type'        => $error_type,
				'error_direction'   => $error_direction,
			)
		);
	}

	/**
	 * Builds a `WP_Error` carrying the standardized connection error data.
	 *
	 * Convenience wrapper around `build_connection_error_data()` — see it for the
	 * data contract. All connection error reporters should create their `WP_Error`
	 * objects through this factory.
	 *
	 * @since 8.9.0
	 *
	 * @param string $error_code        The error code, ideally one of `$known_errors`.
	 * @param string $error_message     The human-readable error message.
	 * @param array  $signature_details Details of the signed request that failed. See `build_connection_error_data()`.
	 * @param string $error_type        One of the `ERROR_TYPE_*` constants.
	 * @param string $error_direction   One of the `DIRECTION_*` constants, or '' for errors with no direction.
	 * @param array  $extra             Optional additional data. See `build_connection_error_data()`.
	 * @return \WP_Error
	 */
	public static function build_connection_wp_error( string $error_code, string $error_message, array $signature_details, string $error_type, string $error_direction, array $extra = array() ) {
		return new \WP_Error(
			$error_code,
			$error_message,
			self::build_connection_error_data( $signature_details, $error_type, $error_direction, $extra )
		);
	}

	/**
	 * Converts a WP_Error object in the array representation we store in the database
	 *
	 * The `WP_Error` data must follow the contract defined by `build_connection_error_data()`:
	 * a `signature_details` array containing at least a `token` key is required, and this
	 * method returns false without storing anything when it is absent. `error_type` and
	 * `error_direction` are read from the data and stored as '' when missing.
	 *
	 * The user attribution comes from the token in `signature_details`, which identifies
	 * the exact credential that failed. An explicit `user_id` in the error data is only
	 * consulted as a fallback when the token yields no user (e.g. non-signature errors
	 * such as `invalid_connection_owner`, which are reported with an empty token).
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

		if ( 'invalid' === $user_id && isset( $data['user_id'] ) && is_numeric( $data['user_id'] ) ) {
			$user_id = (string) (int) $data['user_id'];
		}

		$error_data = $signature_details;

		// For invalid_connection_owner, has_user_token distinguishes a missing owner
		// token from a deleted owner WP user. Keep it so display code can tell the
		// two flavors apart.
		if ( isset( $data['has_user_token'] ) ) {
			$error_data['has_user_token'] = (bool) $data['has_user_token'];
		}

		return $this->build_error_array(
			$error->get_error_code(),
			$error->get_error_message(),
			$error_data,
			$user_id,
			empty( $data['error_type'] ) ? '' : $data['error_type'],
			empty( $data['error_direction'] ) ? '' : $data['error_direction']
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
			$encrypted_data = base64_encode( sodium_crypto_box_seal( wp_json_encode( $data, JSON_UNESCAPED_SLASHES ), base64_decode( JETPACK__ERRORS_PUBLIC_KEY ) ) );
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
				if ( empty( $error['timestamp'] ) || self::ERROR_LIFE_TIME < time() - (int) $error['timestamp'] ) {
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
	 * Only 'xmlrpc' and 'rest' type errors are deleted. 'local_state' type errors are
	 * deliberately kept: they describe local connection state (e.g. a missing owner token),
	 * which a successful API request does not disprove.
	 *
	 * @since 1.54.0
	 *
	 * @return void
	 */
	public function delete_all_api_errors() {
		$type_filter = function ( $errors ) {
			if ( is_array( $errors ) ) {
				foreach ( $errors as $key => $error ) {
					if ( ! empty( $error['error_type'] ) && in_array( $error['error_type'], array( self::ERROR_TYPE_XMLRPC, self::ERROR_TYPE_REST ), true ) ) {
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
	 * Check an outgoing signed request's response for errors, and store them if needed.
	 *
	 * This is the entry point of the outgoing-request error flow (flow 2 in the class
	 * docblock). `Client::remote_request()` calls it after every outgoing signed request.
	 * Errors captured here are stored directly as verified — the WP.com verification
	 * round-trip used for incoming errors is unnecessary, because the error arrived in a
	 * response to a request this site itself initiated and signed.
	 *
	 * Note: XML-RPC faults arrive as HTTP 200 responses with an XML body, so they are
	 * invisible to this method — only errors surfaced at the HTTP level with a JSON error
	 * envelope are captured. This is one of the reasons outgoing calls are being migrated
	 * from XML-RPC to REST.
	 *
	 * @see wp_remote_request() For more information on the $http_response array format.
	 * @param array|\WP_Error $http_response The response or WP_Error on failure.
	 * @param array           $auth_data Auth data, allowed keys: `token`, `timestamp`, `nonce`, `body-hash`.
	 * @param string          $url Request URL.
	 * @param string          $method Request method.
	 * @param string          $error_type The transport of the outgoing request: `ERROR_TYPE_XMLRPC` or `ERROR_TYPE_REST`.
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

		// Support both error envelopes: the legacy v1 JSON-API shape (`error`) and the
		// WP-API v2 shape (`code`), the latter used by `wpcom/v2` endpoints such as
		// `jetpack-wpcom-user-data`. Prefer `error` for backwards compatibility.
		$error_code = is_array( $body ) ? ( $body['error'] ?? $body['code'] ?? null ) : null;

		if ( empty( $error_code ) || ( ! is_string( $error_code ) && ! is_int( $error_code ) ) ) {
			return;
		}

		$error = self::build_connection_wp_error(
			(string) $error_code,
			empty( $body['message'] ) ? '' : $body['message'],
			array(
				'token'     => empty( $auth_data['token'] ) ? '' : $auth_data['token'],
				'timestamp' => empty( $auth_data['timestamp'] ) ? '' : $auth_data['timestamp'],
				'nonce'     => empty( $auth_data['nonce'] ) ? '' : $auth_data['nonce'],
				'body_hash' => empty( $auth_data['body_hash'] ) ? '' : $auth_data['body_hash'],
				'method'    => $method,
				'url'       => $url,
			),
			$error_type,
			self::DIRECTION_OUTGOING
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
		return has_filter( 'jetpack_connection_get_verified_errors' ) &&
			$this->should_allow_error_filtering();
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
