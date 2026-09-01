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
 * 3. It stores the error in the database, but we don't know yet if this is a valid error, because
 *    we can't confirm it came from WP.com.
 * 4. It encrypts the error details and sends it to the wp.com server
 * 5. wp.com checks it and, if valid, sends a new request back to this site using the verify_xml_rpc_error REST endpoint
 * 6. This endpoint adds this error to the Verified errors in the database
 * 7. Triggers a workflow depending on the error (display user an error message, do some self healing, etc.)
 *
 * Flow 2 — outgoing request errors. Entry points: `check_api_response_for_errors()`,
 * `check_signed_request_for_errors()`, and `check_xmlrpc_fault_for_errors()`.
 *
 * 1. Every signed request made through `Client::remote_request()` has its response checked
 *    by `check_api_response_for_errors()`. A request that could not be signed at all never
 *    gets a response, so `Client::remote_request()` passes the signing failure to
 *    `check_signed_request_for_errors()` instead. An XML-RPC fault arrives as an HTTP 200
 *    response with an XML body, so it never reaches `check_api_response_for_errors()` either
 *    (which returns immediately on a 200 and decodes the body as JSON); `Jetpack_IXR_Client::query()`
 *    calls `check_xmlrpc_fault_for_errors()` directly from its fault branch instead.
 * 2. When the response (or the signing failure, or the fault) carries a known error code, the
 *    error is stored and immediately marked verified (the same hourly gate applies). The
 *    WP.com verification round-trip of flow 1 is skipped because the error arrived in a
 *    response to a request this site itself initiated and signed — the failed response is its
 *    own evidence — or, for signing failures, because the evidence is the site's own state.
 *
 * Stored errors carry two orthogonal classification fields:
 *
 * - `error_type` — the transport/source of the failed request: 'xmlrpc', 'rest',
 *   'local_state' (connection-state errors that a successful outgoing request cannot
 *   disprove — e.g. `invalid_connection_owner`, or WP.com being blocked from reaching
 *   this site; stored as 'connection' by package versions <= 8.8), or '' for entries
 *   stored by older package versions.
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
		'malformed_user_id',         // The user_id segment of the request token is not numeric.
		'unknown_user',              // The request token's user does not exist on this site.
		// Incoming and outgoing token problems (Manager::internal_verify_xml_rpc_signature; Client::build_signed_request).
		'malformed_token',           // Request token is empty/garbled or version-mismatched (incoming); or the local token has no secret half (outgoing).
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
		// for an outbound request (Error_Handler::check_api_response_for_errors,
		// Error_Handler::check_xmlrpc_fault_for_errors).
		'could_not_sign',            // Signing the request failed for an unknown reason.
		'invalid_scheme',            // Invalid URL scheme when signing.
		'unknown_scheme_port',       // The URL scheme has no known port, so the signature cannot be built.
		'invalid_secret',            // The stored token secret is invalid.
		'invalid_token',             // No token available when signing; from WPCOM: the token used was rejected.
		'token_mismatch',            // The request token doesn't match the token we hold.
		'invalid_body',              // The request body is malformed.
		'invalid_signature',         // A signature parameter is malformed, or the timestamp is off (clock skew).
		'invalid_body_hash',         // The body hash doesn't match the request body.
		'invalid_nonce',             // The request nonce could not be added (likely a reuse/replay).
		'signature_mismatch',        // Computed signature differs: wrong secret, or URL/body drift (domain change, proxy).
		// Connection state problems (Manager::get_connection_owner, Connection_Health_Tests).
		'invalid_connection_owner',  // The connection owner cannot be resolved: token missing or WP user deleted.
		'xmlrpc_request_blocked',    // WP.com reached the site but the request was rejected (firewall, WAF, or server rule).
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
			$generic_message = __( "Your connection with WordPress.com seems to be broken. If you're experiencing issues, please try reconnecting.", 'jetpack-connection' );

			$owner_id        = (int) \Jetpack_Options::get_option( 'master_user' );
			$viewer_is_owner = $owner_id > 0 && $viewer_id === $owner_id;
			$is_transferable = ( new Manager() )->is_ownership_transferable();

			foreach ( $verified_errors as $error_code => $users ) {
				// Only process error codes that are meant to be displayed to users.
				// A raw verified error whose code is marked non-displayable in
				// get_error_display_configs() is never surfaced.
				$display_config = $this->get_error_display_config( $error_code );
				if ( null === $display_config ) {
					continue;
				}

				foreach ( $users as $user_id => $error ) {
					// An error that cannot be attributed to the blog token or to any user's
					// token belongs to no audience and is not actionable by any viewer.
					if ( 'invalid' === $user_id ) {
						continue;
					}

					// An owner error attributed to someone who is no longer the connection
					// owner describes a previous owner's token. Nobody can act on it.
					// Only skip when there is a current owner to compare against.
					if ( 'invalid_connection_owner' === $error_code
						&& $owner_id > 0
						&& (int) $user_id !== $owner_id ) {
						continue;
					}

					$audience = $this->classify_error_audience( $user_id, $owner_id );

					// A viewer is only ever shown errors for: their own user connection, the
					// site connection, or the connection owner. Another (non-owner) user's
					// broken token is invisible to everyone else, not just non-actionable.
					// `invalid_connection_owner` is exempt: when there's no current owner to
					// compare against, it falls back to 'user' audience by ID alone.
					if ( 'user' === $audience
						&& (int) $user_id !== $viewer_id
						&& 'invalid_connection_owner' !== $error_code ) {
						continue;
					}

					$message = $generic_message;
					$action  = null;

					if ( isset( $display_config['message_callback'] ) ) {
						$message = call_user_func( $display_config['message_callback'], $error );
					}

					// The owner reading their own missing-token error. The message callback
					// has no viewer context, so it describes the owner in the third person —
					// correct for every other reader, but stilted for the owner themselves.
					// Only the missing-token flavor needs this: the deleted-WP-user flavor
					// cannot be viewed by an owner who no longer exists.
					if ( 'owner' === $audience
						&& $viewer_is_owner
						&& 'invalid_connection_owner' === $error_code
						&& ! ( $error['error_data']['has_user_token'] ?? true ) ) {
						$message = __( 'You need to reconnect your WordPress.com account to restore the connection.', 'jetpack-connection' );
					} elseif ( 'owner' === $audience && ! $viewer_is_owner ) {
						// A secondary admin looking at the connection owner's token error. What
						// they can usefully be told depends on whether ownership is transferable.
						// Only name the owner, or describe what reconnecting would do, for
						// viewers who can act on connection issues.
						$viewer_can_connect = current_user_can( 'jetpack_connect' );
						$owner_name         = '';
						if ( $viewer_can_connect ) {
							$owner      = get_userdata( $owner_id );
							$owner_name = $owner instanceof \WP_User ? $owner->display_name : '';
						}

						if ( ! $is_transferable ) {
							// Ownership is locked (a consumer declared it non-transferable).
							// This admin cannot resolve the error themselves, so surface an
							// informational notice naming the owner and offer no reconnect CTA.
							$message = $owner_name
								? sprintf(
									/* translators: %s is the display name of the Jetpack connection owner. */
									__( 'The connection owner (%s) needs to reconnect their WordPress.com account to restore the connection.', 'jetpack-connection' ),
									$owner_name
								)
								: __( 'The connection owner needs to reconnect their WordPress.com account to restore the connection.', 'jetpack-connection' );
							$action = 'none';
						} elseif ( $viewer_can_connect ) {
							// Ownership is transferable, so the reconnect CTA stays available
							// to this admin — but it is destructive in a way the generic copy
							// doesn't convey. Manager::restore() branches on the *clicking*
							// user's tokens, not on whose token the error describes.
							$message = $owner_name
								? sprintf(
									/* translators: %s is the display name of the Jetpack connection owner. */
									__( 'The connection owner (%s) needs to reconnect their WordPress.com account to restore the connection. If you reconnect instead, you will become the new connection owner and every other user will be disconnected from WordPress.com.', 'jetpack-connection' ),
									$owner_name
								)
								: __( 'The connection owner needs to reconnect their WordPress.com account to restore the connection. If you reconnect instead, you will become the new connection owner and every other user will be disconnected from WordPress.com.', 'jetpack-connection' );
						}
					}

					$error['audience']      = $audience;
					$error['error_message'] = $message;

					// Only emit error_data.action when it deviates from the default. Readers
					// already fall back to the reconnect CTA when no action is set, and
					// injecting an explicit 'reconnect' could trip consumer code paths
					// reserved for custom actions.
					if ( null !== $action || ! empty( $display_config['support_link'] ) ) {
						$error_data = ( isset( $error['error_data'] ) && is_array( $error['error_data'] ) ) ? $error['error_data'] : array();

						if ( null !== $action ) {
							$error_data['action'] = $action;
						}

						// Flags a reconnect-may-not-fix-it error so the notice offers a
						// support link alongside the reconnect CTA. See `support_link` in
						// get_error_display_configs().
						if ( ! empty( $display_config['support_link'] ) ) {
							$error_data['support_link'] = true;
						}

						$error['error_data'] = $error_data;
					}

					if ( ! isset( $displayable_errors[ $error_code ] ) ) {
						$displayable_errors[ $error_code ] = array();
					}
					$displayable_errors[ $error_code ][ $user_id ] = $error;
				}
			}

			// A broken connection owner outranks everything else in the set. Run this
			// before the external filter below so consumer-injected errors are never
			// dropped by it — they are the consumer's own state, not ours to rank.
			$displayable_errors = $this->promote_owner_errors( $displayable_errors );
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
	 * Returns the display configuration for error codes that are meant to be
	 * displayed to users, keyed by error code.
	 *
	 * This is the whitelist consulted by get_displayable_errors(): a raw verified
	 * error whose code is not displayable here is never surfaced. Every code in
	 * `$known_errors` appears in get_error_display_configs(), non-displayable ones
	 * as `false` with the reason recorded alongside them.
	 *
	 * Copy is resolved at display time rather than stored with the error, so messages
	 * follow the viewer's locale and stay current across package updates. Adding a new
	 * error code means adding one entry to get_error_display_configs() — no branching
	 * in the display or notice paths.
	 *
	 * Everything here is display-time state that cannot be stored with the error:
	 * copy must resolve in each viewer's locale and follow current code, and the
	 * notice flags describe how this package renders, not the error itself. The
	 * error's *action* is deliberately NOT configured here — reporters declare it
	 * at creation time in `error_data['action']` (see `wp_error_to_array()`), since
	 * it is a stable machine token.
	 *
	 * Recognized keys, all optional:
	 * - `message_callback` (callable): receives the stored error array, returns the
	 *   displayable message. Omit to keep the generic reconnect copy.
	 * - `default_admin_notice` (bool): when true, generic_admin_notice_error() shows
	 *   this error's message even when no consumer supplies one via the
	 *   `jetpack_connection_error_notice_message` filter (which still overrides).
	 *   This is the only key that reaches beyond My Jetpack's own display: it opts
	 *   the code into a site-wide wp-admin notice. Leave it unset unless the error
	 *   genuinely needs that broader reach (see `xmlrpc_request_blocked` below for why).
	 * - `notice_link` (array): presentational `label` and `url` for a link appended to
	 *   the default admin notice only. Only used when the notice shows this error's
	 *   default message (a filtered message keeps full control of the copy).
	 * - `survives_owner_promotion` (bool): when true, this code is not dropped by
	 *   promote_owner_errors() while the connection owner's own connection is broken.
	 *   Set it only for a code that is not a token problem, and so is not waiting on
	 *   the owner's reconnect to become actionable. Setting it does not make the code
	 *   trigger that reduction — it only exempts it from one.
	 * - `support_link` (bool): when true, `error_data['support_link']` is set on the
	 *   displayable error, and My Jetpack's notice appends a "Contact Jetpack
	 *   Support" link next to the reconnect CTA. Set it only where reconnecting is
	 *   not reliably the fix, so the viewer has somewhere else to go.
	 *
	 * @since 8.10.0
	 * @since 8.11.0 Merged with the former hardcoded list in get_displayable_errors():
	 *        this method is now also the whitelist, not just the source of overrides.
	 *
	 * @param string $error_code The error code.
	 * @return array|null Display configuration, or null if this code is not displayable.
	 */
	private function get_error_display_config( $error_code ) {
		$config = $this->get_error_display_configs()[ $error_code ] ?? false;

		return false === $config ? null : $config;
	}

	/**
	 * Returns the display disposition of every code in `$known_errors`, keyed by
	 * error code: an array of display configuration for a displayable code, or
	 * `false` for one that is never surfaced to users.
	 *
	 * Kept in the same order as `$known_errors` so the two read side by side, and
	 * covering every code rather than only the displayable ones.
	 *
	 * Split out from get_error_display_config() so the full set can be enumerated
	 * without invoking that method once per known error code.
	 *
	 * @since 8.11.0
	 *
	 * @return array Display configuration (array) or `false`, keyed by error code.
	 */
	private function get_error_display_configs() {
		static $configs = null;

		if ( null !== $configs ) {
			return $configs;
		}

		// What each code means is documented once, on `$known_errors`. The comments
		// here record only the display decision, and only where it isn't obvious: an
		// uncommented `array()` is a broken token that reconnecting fixes, which is
		// what the generic copy already says.
		$configs = array(
			// Attacker-controllable garbage in an incoming request. Nothing about this
			// site's own connection is wrong.
			'malformed_user_id'        => false,
			// Expected after a user is deleted, and the owner flavor is covered by
			// invalid_connection_owner. Incoming reports also drive WP.com-side
			// self-healing, so a notice would surface a problem already resolving itself.
			'unknown_user'             => false,
			'malformed_token'          => array(),
			// Never connecting a WordPress.com account is expected, not broken. The owner
			// flavor is covered by invalid_connection_owner.
			'no_user_tokens'           => false,
			// Same, for a site that has never had an owner. invalid_connection_owner
			// covers the case where there was one and it broke.
			'empty_master_user_option' => false,
			// As no_user_tokens, for a single requested user.
			'no_token_for_user'        => false,
			'token_malformed'          => array(),
			// Corrupt local token data, but for one user only, and the
			// no_valid_user_token/token_malformed pair surfaces it when it actually
			// blocks a request.
			'user_id_mismatch'         => false,
			'no_possible_tokens'       => array(),
			'no_valid_user_token'      => array(),
			'no_valid_blog_token'      => array(),
			'unknown_token'            => array(),
			'could_not_sign'           => array(),
			// Both are about the URL being signed, not the connection: a code bug or an
			// exotic site URL, which reconnecting does not change.
			'invalid_scheme'           => false,
			'unknown_scheme_port'      => false,
			// Corrupt local token data like token_malformed above, caught at signing time
			// rather than lookup time. Reconnect fixes it the same way.
			'invalid_secret'           => array(),
			'invalid_token'            => array(),
			'token_mismatch'           => array(),
			// Per-request and transport-level, so unaffected by the state of the connection.
			'invalid_body'             => false,
			// Environmental in both directions — a malformed parameter or clock skew,
			// neither of which a reconnect fixes.
			'invalid_signature'        => false,
			// Something altered the request in transit. Not a token problem, and
			// signature_mismatch carries the same diagnosis with usable copy.
			'invalid_body_hash'        => false,
			// A replay, or object-cache trouble. Self-resolving per request.
			'invalid_nonce'            => false,
			// Ambiguous cause: could be a genuine secret desync (reconnect fixes it) or a
			// proxy/CDN/WAF/security plugin altering the request in transit (reconnect
			// doesn't help). Uses the generic message — support_link offers an
			// alternative either way.
			'signature_mismatch'       => array(
				'support_link' => true,
			),
			// Two flavors with different remedies — see
			// get_invalid_connection_owner_message().
			'invalid_connection_owner' => array(
				'message_callback' => array( $this, 'get_invalid_connection_owner_message' ),
			),
			// The token can be perfectly valid here: the site is rejecting WordPress.com's
			// requests, so a reconnect would be rejected the same way. The callback
			// suppresses the reconnect CTA and names the real cause, staying brief because
			// Site Health holds the full diagnosis. Ships a default admin notice because
			// no other detection path can see this — WP.com's requests never arrive. And
			// it outlives a broken owner, whose reconnect the same rule would block.
			'xmlrpc_request_blocked'   => array(
				'message_callback'         => array( $this, 'get_blocked_request_message' ),
				'default_admin_notice'     => true,
				'survives_owner_promotion' => true,
				'notice_link'              => array(
					'label' => __( 'Visit Site Health', 'jetpack-connection' ),
					'url'   => admin_url( 'site-health.php' ),
				),
			),
		);

		return $configs;
	}

	/**
	 * Builds the displayable message for the invalid-connection-owner error.
	 *
	 * `has_user_token` (set in Manager::get_connection_owner(), carried through into
	 * `error_data` by wp_error_to_array()) distinguishes the two flavors:
	 * - false: the owner's user token is simply missing — they still exist as a
	 *   WP user, so reconnecting as them restores the connection.
	 * - true: the token is there, but the WP user it points at was deleted from
	 *   this site. Nobody can reconnect as a user who no longer exists —
	 *   reconnecting here means a different admin becoming the new owner, not
	 *   the original owner logging back in.
	 *
	 * @since 8.11.0
	 *
	 * @param array $error The stored error array.
	 * @return string The message.
	 */
	private function get_invalid_connection_owner_message( $error ) {
		if ( ! ( $error['error_data']['has_user_token'] ?? true ) ) {
			return __( 'The connection owner needs to reconnect their WordPress.com account to restore the connection.', 'jetpack-connection' );
		}

		return __( 'The WordPress.com account for this connection no longer exists on this site. An administrator needs to reconnect to become the new connection owner.', 'jetpack-connection' );
	}

	/**
	 * Builds the displayable message for the blocked-request error.
	 *
	 * Deliberately brief: Site Health holds the detailed diagnosis (including the
	 * HTTP status the site returned) and the resolution steps, so the message only
	 * names the condition and points there.
	 *
	 * @since 8.10.0
	 *
	 * @param array $error The stored error array (unused; part of the message_callback contract).
	 * @return string The message.
	 */
	private function get_blocked_request_message( $error ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return __( 'WordPress.com requests to your site are being blocked, usually by a firewall or security rule. See Site Health for details and next steps.', 'jetpack-connection' );
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
	 * Reduces a set of displayable errors to the connection-owner ones when the
	 * owner's own connection is broken.
	 *
	 * The connection owner is the account every other connection on the site hangs
	 * off. While it is broken, no other error in the set is independently
	 * actionable.
	 *
	 * Two shapes count as a broken owner:
	 * - any error classified with the `owner` audience, i.e. attributed to the
	 *   current owner's user ID; and
	 * - `invalid_connection_owner` at any audience — when there is no current owner
	 *   to compare a user ID against, classify_error_audience() falls back to
	 *   `user`, but the code itself already says the owner cannot be resolved.
	 *
	 * A code whose display config sets `survives_owner_promotion` is kept regardless.
	 * The premise above holds for token errors, whose one remedy is a reconnect the
	 * owner has to perform first — see that key's documentation on
	 * get_error_display_config() for when it doesn't.
	 *
	 * @since 8.11.0
	 *
	 * @param array $displayable_errors Displayable errors, keyed by error code then user ID.
	 * @return array The owner-only subset when the owner is broken, otherwise the input unchanged.
	 */
	private function promote_owner_errors( array $displayable_errors ) {
		$owner_errors    = array();
		$has_owner_error = false;

		foreach ( $displayable_errors as $error_code => $users ) {
			// Errors injected by a consumer through the filter that runs after this
			// reduction have no config of ours; anything reaching here without one is
			// treated as ordinary.
			$display_config = $this->get_error_display_config( $error_code );
			$survives       = null !== $display_config && ! empty( $display_config['survives_owner_promotion'] );

			foreach ( $users as $user_id => $error ) {
				$is_owner_error = 'owner' === ( $error['audience'] ?? '' )
					|| 'invalid_connection_owner' === $error_code;

				if ( ! $is_owner_error && ! $survives ) {
					continue;
				}

				$owner_errors[ $error_code ][ $user_id ] = $error;

				// An exempt error is not itself a broken owner, so it must not trigger the
				// reduction on its own — only survive one triggered by something else.
				$has_owner_error = $has_owner_error || $is_owner_error;
			}
		}

		return $has_owner_error ? $owner_errors : $displayable_errors;
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

		$transient = self::error_reporting_gate_transient( $error );

		if ( get_transient( $transient ) ) {
			return false;
		}

		set_transient( $transient, true, HOUR_IN_SECONDS );
		return true;
	}

	/**
	 * Builds the reporting-gate transient name for an error.
	 *
	 * Keyed by code and direction, not code alone: an outgoing error is reported
	 * immediately and verified locally (no WP.com round trip), while an incoming error of the
	 * same code still needs to clear the gate to reach the `verify_xml_rpc_error` round trip
	 * that triggers WP.com-side self-healing (flow 1 in the class docblock).
	 *
	 * @param \WP_Error $error the error object.
	 * @return string
	 */
	private static function error_reporting_gate_transient( \WP_Error $error ) {
		$error_data      = $error->get_error_data();
		$error_direction = is_array( $error_data ) && ! empty( $error_data['error_direction'] ) ? $error_data['error_direction'] : '';

		return self::ERROR_REPORTING_GATE . $error->get_error_code() . '_' . $error_direction;
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

		if ( ! $error_array ) {
			return false;
		}

		$error_code = $error->get_error_code();
		$user_id    = $error_array['user_id'];

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
	 * @param string $error_message     The human-readable error message. `build_error_array()` rejects an
	 *                                  empty message, so a generic fallback is substituted when this is ''.
	 * @param array  $signature_details Details of the signed request that failed. See `build_connection_error_data()`.
	 * @param string $error_type        One of the `ERROR_TYPE_*` constants.
	 * @param string $error_direction   One of the `DIRECTION_*` constants, or '' for errors with no direction.
	 * @param array  $extra             Optional additional data. See `build_connection_error_data()`.
	 * @return \WP_Error
	 */
	public static function build_connection_wp_error( string $error_code, string $error_message, array $signature_details, string $error_type, string $error_direction, array $extra = array() ) {
		return new \WP_Error(
			$error_code,
			'' === $error_message ? __( 'An error occurred with the connection.', 'jetpack-connection' ) : $error_message,
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

		// For xmlrpc_request_blocked, the HTTP status the site returned to WP.com
		// (e.g. 403). Keep it so display code can include it in the message.
		if ( isset( $data['site_http_status'] ) ) {
			$error_data['site_http_status'] = (int) $data['site_http_status'];
		}

		// The display action declared by the reporter at creation time, e.g. 'none'
		// to suppress the reconnect CTA. Only our own reporters set this (it is never
		// derived from request data); readers treat a missing action as 'reconnect'.
		if ( isset( $data['action'] ) && is_string( $data['action'] ) ) {
			$error_data['action'] = $data['action'];
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
	 * Deletes all stored and verified errors for a single error code.
	 *
	 * Used by self-healing flows that can positively confirm one specific error
	 * condition is gone (e.g. a passing connection test clearing
	 * `xmlrpc_request_blocked`) without touching unrelated errors.
	 *
	 * @since 8.10.0
	 *
	 * @param string $error_code The error code to delete.
	 * @return bool True if any stored or verified error was deleted.
	 */
	public function delete_error_by_code( $error_code ) {
		$deleted = false;

		// Reopen the reporting gate for this code: deletion means the condition was
		// positively confirmed cleared, so a recurrence must be reportable immediately
		// rather than suppressed for up to an hour. The gate is keyed by code + direction
		// (see error_reporting_gate_transient()), so every direction variant is cleared.
		delete_transient( self::ERROR_REPORTING_GATE . $error_code . '_' . self::DIRECTION_INCOMING );
		delete_transient( self::ERROR_REPORTING_GATE . $error_code . '_' . self::DIRECTION_OUTGOING );
		delete_transient( self::ERROR_REPORTING_GATE . $error_code . '_' );

		$stored_errors = $this->get_stored_errors();
		if ( isset( $stored_errors[ $error_code ] ) ) {
			unset( $stored_errors[ $error_code ] );
			$deleted = true;
			if ( count( $stored_errors ) ) {
				update_option( self::STORED_ERRORS_OPTION, $stored_errors );
			} else {
				delete_option( self::STORED_ERRORS_OPTION );
			}
		}

		$verified_errors = $this->get_verified_errors();
		if ( isset( $verified_errors[ $error_code ] ) ) {
			unset( $verified_errors[ $error_code ] );
			$deleted = true;
			if ( count( $verified_errors ) ) {
				update_option( self::STORED_VERIFIED_ERRORS_OPTION, $verified_errors );
			} else {
				delete_option( self::STORED_VERIFIED_ERRORS_OPTION );
			}
		}

		if ( $deleted ) {
			$this->invalidate_displayable_errors_cache();
		}

		return $deleted;
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

		$displayable_errors = $this->get_displayable_errors();

		// Most errors default to no admin notice — consumers opt in via the filter
		// below, and the React dashboard is the primary surface. Error codes whose
		// display config sets `default_admin_notice` provide their own message and
		// do not depend on a consumer supplying one.
		$default_message = '';
		$notice_link     = null;
		foreach ( $displayable_errors as $error_code => $user_errors ) {
			$display_config = $this->get_error_display_config( $error_code );
			if ( empty( $display_config['default_admin_notice'] ) ) {
				continue;
			}
			// On selected hosting platforms the displayable errors pass through a
			// consumer filter, so the shape is not guaranteed.
			if ( ! is_array( $user_errors ) ) {
				continue;
			}
			$first_error = reset( $user_errors );
			if ( is_array( $first_error ) && ! empty( $first_error['error_message'] ) ) {
				$default_message = $first_error['error_message'];
				$notice_link     = $display_config['notice_link'] ?? null;
				break;
			}
		}

		/**
		 * Filters the message to be displayed in the admin notices area when there's a connection error.
		 *
		 * By default we don't display any errors, except for the blocked-request error
		 * (`xmlrpc_request_blocked`), which provides its own default message.
		 *
		 * Return an empty value to disable the message.
		 *
		 * @since 8.9.0
		 * @since 8.10.0 The default message is no longer always empty.
		 *
		 * @param string $message The error message.
		 * @param array  $errors The array of errors. See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		 */
		$message = apply_filters( 'jetpack_connection_error_notice_message', $default_message, $displayable_errors );

		/**
		 * Fires inside the admin_notices hook just before displaying the error message for a broken connection.
		 *
		 * If you want to disable the default message from being displayed, return an empty value in the jetpack_connection_error_notice_message filter.
		 *
		 * @since 8.9.0
		 *
		 * @param array $errors The array of errors. See Automattic\Jetpack\Connection\Error_Handler for details on the array structure.
		 */
		do_action( 'jetpack_connection_error_notice', $displayable_errors );

		if ( empty( $message ) ) {
			return;
		}

		$notice_content = esc_html( $message );

		// Append the link only when the notice is showing the unmodified default
		// message — a filtered message keeps full control of the copy.
		if ( $notice_link && $message === $default_message && ! empty( $notice_link['url'] ) && ! empty( $notice_link['label'] ) ) {
			$notice_content .= sprintf(
				' <a href="%1$s">%2$s</a>',
				esc_url( $notice_link['url'] ),
				esc_html( $notice_link['label'] )
			);
		}

		wp_admin_notice(
			$notice_content,
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
	 * envelope are captured. `Jetpack_IXR_Client::query()` reports faults itself, via
	 * check_xmlrpc_fault_for_errors().
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
				// `Client::build_signed_request()` builds this key as `body-hash` (it is sent as an
				// `Authorization` header parameter). The snake_case fallback keeps callers that pass
				// the stored `signature_details` shape working.
				'body_hash' => $auth_data['body-hash'] ?? $auth_data['body_hash'] ?? '',
				'method'    => $method,
				'url'       => $url,
			),
			$error_type,
			self::DIRECTION_OUTGOING
		);

		$this->report_error( $error, false, true );
	}

	/**
	 * Check the result of signing an outgoing request for errors, and store them if needed.
	 *
	 * This is the second entry point of the outgoing-request error flow (flow 2 in the class
	 * docblock). It handles failures from `Client::build_signed_request()`, which
	 * occur before a request is sent and therefore have no response to inspect.
	 *
	 * Like response errors in flow 2, these are stored as verified without a WP.com
	 * round-trip because the site's own token and URL state provides the evidence.
	 * The hourly reporting gate in `report_error()` still applies.
	 *
	 * Codes reaching this method include `malformed_token` and `invalid_body` (from
	 * `Client::build_signed_request()`), plus the signing errors returned by
	 * `Jetpack_Signature::sign_request()` (e.g. `invalid_scheme`, `unknown_scheme_port`),
	 * plus the token-lookup errors raised by `Tokens::get_access_token()` (e.g.
	 * `no_user_tokens`, `no_token_for_user`). `tokens_locked` also reaches here but is not
	 * in `known_errors`, so `report_error()` silently discards it — see the comment on
	 * `Client::build_signed_request()`'s `tokens_locked` branch for why.
	 *
	 * This includes token lookup, request validation, and request signing errors.
	 *
	 * @since 8.10.1
	 *
	 * @param mixed  $signing_result The return value of `Client::build_signed_request()`. Ignored unless it is a `WP_Error`.
	 * @param string $url            Request URL.
	 * @param string $method         Request method.
	 * @param string $error_type     The transport of the outgoing request: `ERROR_TYPE_XMLRPC` or `ERROR_TYPE_REST`.
	 *
	 * @return void
	 */
	public function check_signed_request_for_errors( $signing_result, $url, $method, $error_type ) {
		if ( ! is_wp_error( $signing_result ) ) {
			return;
		}

		$data = $signing_result->get_error_data();

		// The signing errors raised by `Jetpack_Signature` already carry the details of the
		// request they failed to sign; the ones raised by `Client` itself carry nothing.
		$signature_details = isset( $data['signature_details'] ) && is_array( $data['signature_details'] )
			? $data['signature_details']
			: array();

		$signature_details += array(
			'method' => $method,
			'url'    => $url,
		);

		$error = self::build_connection_wp_error(
			(string) $signing_result->get_error_code(),
			$signing_result->get_error_message(),
			$signature_details,
			$error_type,
			self::DIRECTION_OUTGOING,
			// `Tokens::get_access_token()` attaches `user_id` to the WP_Errors it raises when it
			// has already resolved one (see its docblock); pass it through as the attribution
			// fallback consulted by `wp_error_to_array()`. Errors with no token to look up at all
			// (e.g. `tokens_locked`, `malformed_token` from `Client` itself) carry no such data,
			// and fall back to unattributed there.
			array( 'user_id' => isset( $data['user_id'] ) ? (int) $data['user_id'] : 0 )
		);

		$this->report_error( $error, false, true );
	}

	/**
	 * Check an outgoing XML-RPC request's fault response for errors, and store them if needed.
	 *
	 * This is the third entry point of the outgoing-request error flow (flow 2 in the class
	 * docblock). XML-RPC faults arrive as HTTP 200 responses with an XML body, so
	 * check_api_response_for_errors() never sees them — it returns immediately on a 200,
	 * and decodes the body as JSON rather than XML anyway. `Jetpack_IXR_Client::query()`
	 * calls this method directly from its fault branch instead.
	 *
	 * The code/message pair is recovered from the fault string by the caller, via
	 * `Jetpack_IXR_Client::parse_jetpack_fault_string()` — the class that owns the
	 * `Jetpack: [code] message` convention. An unparseable fault string is the caller's
	 * concern, not this method's; a fault code reaching here is untrusted input, and it's
	 * `report_error()`'s `$known_errors` allowlist, not this method, that keeps an
	 * unrecognized code from being stored. In practice every `jetpack.*` XML-RPC handler
	 * on WP.com emits fixed string literals here, never attacker- or request-composed
	 * ones, and the handful that are also `$known_errors` (`unknown_token`,
	 * `signature_mismatch`, `invalid_token`, `token_mismatch`, `invalid_signature`) are
	 * the same codes this site itself raises for the same failure — WP.com is just
	 * verifying signatures with the same scheme.
	 *
	 * @since 8.10.4
	 *
	 * @param string $error_code    The Jetpack error code parsed from the fault string.
	 * @param string $error_message The error message parsed from the fault string.
	 * @param string $url           Request URL.
	 * @param string $method        Request method.
	 * @param int    $user_id       The local user ID the request was signed for, or `0` for the blog token.
	 *
	 * @return void
	 */
	public function check_xmlrpc_fault_for_errors( string $error_code, string $error_message, string $url, string $method, int $user_id = 0 ) {
		$error = self::build_connection_wp_error(
			$error_code,
			$error_message,
			array(
				'method' => $method,
				'url'    => $url,
			),
			self::ERROR_TYPE_XMLRPC,
			self::DIRECTION_OUTGOING,
			array( 'user_id' => $user_id )
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
