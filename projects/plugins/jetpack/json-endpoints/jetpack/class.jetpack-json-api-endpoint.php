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
	 * @param int   $_blog_id - the blog ID.
	 * @param array $capability - the capabilities of the user.
	 * @param bool  $check_validation - if we're checking the validation.
	 *
	 * @return bool|WP_Error a WP_Error object or true if things are good.
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
	 * @param array $capability - the compatability.
	 *
	 * @return bool|WP_Error
	 */
	protected function check_capability( $capability ) {
		// If this endpoint accepts site based authentication, skip capabilities check.
		if ( $this->accepts_site_based_authentication() ) {
			return true;
		}

		// the idea is that the we can pass in an array of capabilitie that the user needs to have before we allowing them to do something
		$capabilities = is_array( $capability ) ? ( $capability['capabilities'] ?? $capability ) : $capability;

		// Deny by default: a request that names no capability must never be authorized here.
		// Endpoints that declare none (e.g. the Backup helper-script endpoints) are reachable only
		// with a Jetpack site (blog) token, which the site-based authentication short-circuit above
		// handles. Without this guard an empty set makes `$must_pass` 0 below, so any connected user
		// token would pass. The check sits above the is_array() split so that scalar declarations
		// that mean "nothing required" -- null, '', 0, '0' -- deny too rather than resolving to a
		// capability every role holds.
		//
		// Note that the short-circuit is the only way past this deny, and that `allow_jetpack_site_auth`
		// (not `allow_fallback_to_jetpack_blog_token`) is what enables it. Its
		// `is_jetpack_authorized_for_site()` half is overridden by a child class on WordPress.com, so
		// what satisfies this deny there is defined outside this repository.
		if ( empty( $capabilities ) ) {
			return new WP_Error( 'unauthorized_site_token_required', __( 'This endpoint is only accessible using a Jetpack site token.', 'jetpack' ), 403 );
		}

		if ( is_array( $capability ) ) {
			// We can pass in the number of conditions we must pass by default it is all.
			$must_pass = ( isset( $capability['must_pass'] ) && is_int( $capability['must_pass'] ) ? $capability['must_pass'] : count( $capabilities ) );

			// A threshold below 1 authorizes unconditionally no matter what the capability list holds,
			// which is the same fail-open the empty set produced. `is_int()` above admits negatives too.
			if ( $must_pass < 1 ) {
				return new WP_Error( 'unauthorized_capability_threshold', __( 'This endpoint requires at least one capability check to pass.', 'jetpack' ), 403 );
			}

			$failed = array(); // store the failed capabilities
			$passed = 0;
			foreach ( $capabilities as $cap ) {
				if ( current_user_can( $cap ) ) {
					++$passed;
				} else {
					$failed[] = $cap;
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
		} elseif ( ! current_user_can( $capability ) ) {
			// Translators: the capability that the user is not authorized for.
			return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), $capability ), 403 );
		}

		return true;
	}
}
