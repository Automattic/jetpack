<?php
/**
 * REST controller for Newsletter Mode.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

/**
 * Registers and handles the package-owned Newsletter Mode endpoint.
 */
class Mode_REST_Controller {

	/**
	 * REST namespace for the package-owned Newsletter Mode route.
	 *
	 * Deliberately a package-owned namespace (not `jetpack/v4`) so persisting the
	 * flag does not require registering it on the shared settings whitelist.
	 *
	 * @var string
	 */
	const REST_NAMESPACE = 'jetpack-newsletter/v1';

	/**
	 * Register the package-owned REST route that reads/writes the mode option.
	 *
	 * GET  /jetpack-newsletter/v1/mode → { enabled: bool }
	 * POST /jetpack-newsletter/v1/mode { enabled: bool } → { enabled: bool }
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::REST_NAMESPACE,
			'/mode',
			array(
				array(
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_mode' ),
					'permission_callback' => array( self::class, 'permission_check' ),
				),
				array(
					'methods'             => \WP_REST_Server::CREATABLE,
					'callback'            => array( self::class, 'update_mode' ),
					'permission_callback' => array( self::class, 'permission_check' ),
					'args'                => array(
						'enabled' => array(
							'type'     => 'boolean',
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check for the mode route: site admins only.
	 *
	 * @return bool
	 */
	public static function permission_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET handler: return whether the mode is currently enabled.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_mode() {
		return rest_ensure_response( array( 'enabled' => Mode::is_enabled() ) );
	}

	/**
	 * POST handler: persist the mode option and return the resulting state.
	 *
	 * Writes the plain option directly (not the shared settings whitelist). The
	 * new value applies on the next page load, which is expected — see plan.
	 *
	 * @param \WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response
	 */
	public static function update_mode( \WP_REST_Request $request ) {
		update_option( Mode::OPTION_NAME, (bool) $request->get_param( 'enabled' ) );

		return rest_ensure_response( array( 'enabled' => Mode::is_enabled() ) );
	}
}
