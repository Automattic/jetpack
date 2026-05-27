<?php
/**
 * REST routes for the Akismet experimental admin UI.
 *
 * Standalone — the experimental plugin owns the `akismet/v1` namespace because
 * the legacy Akismet plugin is inactive on the sandbox. Routes read/write the
 * standard Akismet `wp_options` keys (`wordpress_api_key`, `akismet_strictness`,
 * `akismet_show_user_comments_approved`) directly.
 *
 * Mutation routes (POST/DELETE/PUT) are gated by `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`
 * (see GUARDRAILS.md). The constant is read via `Akismet_Experimental::allow_mutations()`.
 * Client-side, the hooks in `src/hooks/use-*.ts` short-circuit on the same flag
 * for snappy UX; the server check here is defense in depth.
 *
 * @package Akismet_Experimental
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers and serves the akismet/v1 REST routes used by the experimental UI.
 */
class Akismet_Experimental_REST_API {

	const NAMESPACE_V1 = 'akismet/v1';

	/**
	 * Standard Akismet option name for the API key.
	 */
	const OPTION_API_KEY = 'wordpress_api_key';

	/**
	 * Standard Akismet option name for spam strictness (`'0'` review, `'1'` silent discard).
	 */
	const OPTION_STRICTNESS = 'akismet_strictness';

	/**
	 * Standard Akismet option name for the show-approved-comments toggle.
	 */
	const OPTION_SHOW_APPROVED = 'akismet_show_user_comments_approved';

	/**
	 * Wire route registration. Called from `Akismet_Experimental::init()`.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register all six routes.
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_V1,
			'/key',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'set_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
					'args'                => array(
						'key' => array(
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'put_settings' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
					'args'                => array(
						self::OPTION_STRICTNESS    => array(
							'type'              => 'string',
							'enum'              => array( '0', '1' ),
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
						self::OPTION_SHOW_APPROVED => array(
							'type'              => 'string',
							'enum'              => array( '0', '1' ),
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/jetpack-key',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_jetpack_key' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
			)
		);
	}

	/**
	 * Shared permission callback: only users who can manage_options.
	 *
	 * @return bool|WP_Error True if allowed, WP_Error otherwise.
	 */
	public static function manage_options_permission() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to perform this action.', 'akismet' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Mutation guardrail: returns a 403 WP_Error if AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS is off.
	 *
	 * @return null|WP_Error Null when mutations are allowed; WP_Error otherwise.
	 */
	protected static function check_mutation_gate() {
		if ( Akismet_Experimental::allow_mutations() ) {
			return null;
		}
		return new WP_Error(
			'preview_mode_active',
			__( 'Preview mode — action disabled.', 'akismet' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * GET /akismet/v1/key — return the current API key + a coarse validity signal.
	 *
	 * Validity here is "non-empty string of plausible length". The experimental
	 * plugin does NOT round-trip to WPCOM to verify the key; that's a future
	 * concern (and arguably should remain server-side in a real implementation).
	 *
	 * @return WP_REST_Response
	 */
	public static function get_key() {
		$key = (string) get_option( self::OPTION_API_KEY, '' );
		return rest_ensure_response(
			array(
				'key'   => $key,
				'valid' => self::looks_like_key( $key ),
			)
		);
	}

	/**
	 * POST /akismet/v1/key — accept a new key. Gated by AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function set_key( WP_REST_Request $request ) {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		$key = trim( (string) $request->get_param( 'key' ) );
		if ( ! self::looks_like_key( $key ) ) {
			return new WP_Error(
				'akismet_invalid_key',
				__( 'Invalid key. Use the 12-character key from your Akismet account.', 'akismet' ),
				array( 'status' => 400 )
			);
		}
		update_option( self::OPTION_API_KEY, $key );
		return rest_ensure_response(
			array(
				'key'   => $key,
				'valid' => true,
			)
		);
	}

	/**
	 * DELETE /akismet/v1/key — clear the stored key. Gated.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_key() {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		delete_option( self::OPTION_API_KEY );
		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * GET /akismet/v1/settings — return the current strictness + show-approved values.
	 *
	 * Defaults match legacy Akismet: `'0'` for both (review spam, hide counts).
	 *
	 * @return WP_REST_Response
	 */
	public static function get_settings() {
		return rest_ensure_response(
			array(
				self::OPTION_STRICTNESS    => (string) get_option( self::OPTION_STRICTNESS, '0' ),
				self::OPTION_SHOW_APPROVED => (string) get_option( self::OPTION_SHOW_APPROVED, '0' ),
			)
		);
	}

	/**
	 * PUT /akismet/v1/settings — persist a partial patch. Gated.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function put_settings( WP_REST_Request $request ) {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		foreach ( array( self::OPTION_STRICTNESS, self::OPTION_SHOW_APPROVED ) as $opt ) {
			$value = $request->get_param( $opt );
			if ( null !== $value ) {
				update_option( $opt, (string) $value );
			}
		}
		return self::get_settings();
	}

	/**
	 * GET /akismet/v1/jetpack-key — return the Jetpack-connected user's Akismet key.
	 *
	 * In the experimental standalone plugin we don't link against the legacy
	 * `Akismet_Admin::get_jetpack_user` helper. If Jetpack exposes the Akismet
	 * key via `Jetpack_Options::get_option( 'akismet_key' )`, we surface it;
	 * otherwise we return a structured error. Plan 1's UI handles both cases.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_jetpack_key() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return new WP_Error(
				'no_jetpack',
				__( 'Jetpack is not active.', 'akismet' ),
				array( 'status' => 400 )
			);
		}

		$jetpack_key = '';
		if ( class_exists( 'Jetpack_Options' ) && method_exists( 'Jetpack_Options', 'get_option' ) ) {
			$jetpack_key = (string) Jetpack_Options::get_option( 'akismet_key', '' );
		}

		if ( '' === $jetpack_key ) {
			return new WP_Error(
				'no_jetpack_user',
				__( 'No Jetpack-connected user with an Akismet key was found.', 'akismet' ),
				array( 'status' => 400 )
			);
		}

		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}

		update_option( self::OPTION_API_KEY, $jetpack_key );
		return rest_ensure_response(
			array(
				'key'   => $jetpack_key,
				'valid' => true,
			)
		);
	}

	/**
	 * Cheap structural test for an Akismet key: 12+ characters of [a-z0-9].
	 *
	 * The real validity signal is a WPCOM round-trip; this is a quick filter
	 * to avoid persisting obvious junk.
	 *
	 * @param string $key Candidate key.
	 * @return bool
	 */
	protected static function looks_like_key( $key ) {
		return is_string( $key ) && (bool) preg_match( '/^[a-z0-9]{12,}$/', $key );
	}
}
