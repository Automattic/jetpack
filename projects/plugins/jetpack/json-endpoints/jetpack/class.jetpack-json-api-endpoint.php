<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require JETPACK__PLUGIN_DIR . '/modules/module-info.php';

/**
 * Base class for Jetpack Endpoints, has the validate_call helper function.
 */
abstract class Jetpack_JSON_API_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Needed capabilities. Either a single capability, a list of capabilities, or a
	 * `array( 'capabilities' => array( … ), 'must_pass' => int )` wrapper. An empty
	 * value means the endpoint is reachable only with a Jetpack site (blog) token;
	 * every user token is denied. See check_capability().
	 *
	 * @var string|array|null
	 */
	protected $needed_capabilities;

	/**
	 * Expected actions.
	 *
	 * @var array
	 */
	protected $expected_actions = array();

	/**
	 * The action.
	 *
	 * @var string
	 */
	protected $action;

	/**
	 * Callback function.
	 *
	 * @param string $path - the path.
	 * @param int    $blog_id - the blog ID.
	 * @param object $object - parameter is for making the method signature compatible with its parent class method.
	 */
	public function callback( $path = '', $blog_id = 0, $object = null ) {
		$error = $this->validate_call( $blog_id, $this->needed_capabilities );
		if ( is_wp_error( $error ) ) {
			return $error;
		}

		$error = $this->validate_input( $object );
		if ( is_wp_error( $error ) ) {
			return $error;
		}

		if ( ! empty( $this->action ) ) {
			$error = call_user_func( array( $this, $this->action ) );
			if ( is_wp_error( $error ) ) {
				return $error;
			}
		}

		return $this->result();
	}

	/**
	 * The result function.
	 */
	abstract protected function result();

	/**
	 * Validate input.
	 *
	 * @param object $object - unused, for parent class compatability.
	 *
	 * @return bool
	 */
	protected function validate_input( $object ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$args = $this->input();

		if ( isset( $args['action'] ) && $args['action'] === 'update' ) {
			$this->action = 'update';
		}

		if ( preg_match( '!/update/?$!', $this->path ) ) {
			$this->action = 'update';

		} elseif ( preg_match( '/\/install\/?$/', $this->path ) ) {
			$this->action = 'install';

		} elseif ( ! empty( $args['action'] ) ) {
			if ( ! in_array( $args['action'], $this->expected_actions, true ) ) {
				return new WP_Error( 'invalid_action', __( 'You must specify a valid action', 'jetpack' ) );
			}
			$this->action = $args['action'];
		}
		return true;
	}

	/**
	 * Switches to the blog and checks current user capabilities.
	 *
	 * @param int               $_blog_id - the blog ID.
	 * @param string|array|null $capability - the capability declaration to enforce.
	 * @param bool              $check_validation - if we're checking the validation.
	 *
	 * @return true|WP_Error a WP_Error object or true if things are good.
	 */
	protected function validate_call( $_blog_id, $capability, $check_validation = true ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $_blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$error = $this->check_capability( $capability );
		if ( is_wp_error( $error ) ) {
			return $error;
		}

		if (
			$check_validation &&
			'GET' !== $this->method &&
			/**
			 * Filter to disallow JSON API requests to the site.
			 * Setting to false disallows you to manage your site remotely from WordPress.com
			 * and disallows plugin auto-updates.
			 *
			 * @since 7.3.0
			 *
			 * @param bool $check_validation Whether to allow API requests to manage the site
			 */
			! apply_filters( 'jetpack_json_manage_api_enabled', $check_validation )
		) {
			return new WP_Error( 'unauthorized_full_access', __( 'Full management mode is off for this site.', 'jetpack' ), 403 );
		}

		return true;
	}

	/**
	 * Check capability.
	 *
	 * @param string|array|null $capability - the capability declaration to enforce.
	 *
	 * @return true|WP_Error True when authorized; a WP_Error otherwise. Never return a bare falsey
	 *                       value here: validate_call() authorizes on anything that is not a WP_Error.
	 */
	protected function check_capability( $capability ) {
		// If this endpoint accepts site based authentication, skip capabilities check. Note that
		// accepts_site_based_authentication() infers site authentication from a zero current user id;
		// it does not verify that a blog token signed the request.
		if ( $this->accepts_site_based_authentication() ) {
			return true;
		}

		// Resolve the scalar, list and structured wrapper declaration forms to a single value.
		$capabilities = is_array( $capability ) ? ( $capability['capabilities'] ?? $capability ) : $capability;

		// Deny by default: a declaration that names no capability must never authorize a user token.
		// Endpoints that declare none (e.g. the Backup helper-script endpoints) are reachable only with
		// a Jetpack site (blog) token, and the short-circuit above -- enabled by `allow_jetpack_site_auth`,
		// not `allow_fallback_to_jetpack_blog_token` -- is the only way past this deny. Without the guard
		// an empty set makes `$must_pass` 0 below, so any connected user token would pass. The check runs
		// on the resolved set, so the scalar forms meaning "nothing required" are covered by the same
		// rule: `0` and `'0'` were fail-open everywhere because they resolve to `level_0`, which every
		// default role holds, and `null` and `''` denied on single-site but passed for a network super
		// admin on multisite, where `WP_User::has_cap()` returns true whenever the mapped capabilities
		// contain no `do_not_allow`.
		//
		// Scope: under `IS_WPCOM` this file does not run at all -- see the endpoint directory swap in
		// json-endpoints.php -- so this guard governs self-hosted and Atomic sites only.
		if ( empty( $capabilities ) ) {
			return new WP_Error( 'unauthorized_site_token_required', __( 'This endpoint is only accessible using a Jetpack site token.', 'jetpack' ), 403 );
		}

		// Normalize the scalar and list declaration forms to a single list, so that the validation and
		// the capability loop below apply identically to both. A one-element list produces the same
		// error message the scalar branch used to build directly.
		$required_capabilities = is_array( $capabilities ) ? array_values( $capabilities ) : array( $capabilities );

		// Every entry must name an actual capability. An entry nested inside a non-empty list survives
		// the emptiness check above, and `WP_User::has_cap()` routes anything `is_numeric()` through
		// its legacy user-level shim -- `0` and `'0'` become `level_0`, which every default role holds.
		// So `array( 0 )` or `array( '0' )` would authorize any connected user, the same fail-open the
		// empty set produced. The `is_numeric()` test mirrors the one in core that triggers the shim.
		// A whitespace-only entry names no capability either, and core grants a network super admin any
		// capability that does not map to `do_not_allow`, so entries are rejected on their trimmed value.
		//
		// A wrapper with no `capabilities` key resolves to the wrapper's own metadata and lands here too,
		// but only when that metadata is not capability-shaped: `array( 'must_pass' => 0 )` is rejected,
		// while `array( 'must_pass' => 'read' )` is indistinguishable from the list `array( 'read' )` and
		// gets an ordinary capability check. No declaration in this repository uses either shape.
		foreach ( $required_capabilities as $required_capability ) {
			if ( ! is_string( $required_capability ) || '' === trim( $required_capability ) || is_numeric( $required_capability ) ) {
				return new WP_Error( 'unauthorized_capability_declaration', __( 'This endpoint does not declare a valid capability requirement.', 'jetpack' ), 403 );
			}
		}

		// We can pass in the number of conditions we must pass by default it is all.
		$must_pass = ( is_array( $capability ) && isset( $capability['must_pass'] ) && is_int( $capability['must_pass'] ) ? $capability['must_pass'] : count( $required_capabilities ) );

		// A threshold below 1 authorizes unconditionally no matter what the capability list holds,
		// which is the same fail-open the empty set produced. `is_int()` above admits negatives too.
		if ( $must_pass < 1 ) {
			return new WP_Error( 'unauthorized_capability_threshold', __( 'This endpoint requires at least one capability check to pass.', 'jetpack' ), 403 );
		}

		$failed = array(); // store the failed capabilities
		$passed = 0;
		foreach ( $required_capabilities as $required_capability ) {
			if ( current_user_can( $required_capability ) ) {
				++$passed;
			} else {
				$failed[] = $required_capability;
			}
		}
		// Check if all conditions have passed.
		if ( $passed < $must_pass ) {
			return new WP_Error(
				'unauthorized',
				/* translators: %s: comma-separated list of capabilities */
				sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), implode( ', ', $failed ) ),
				403
			);
		}

		return true;
	}
}
