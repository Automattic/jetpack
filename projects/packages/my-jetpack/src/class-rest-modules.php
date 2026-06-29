<?php
/**
 * Sets up the Modules REST API endpoints.
 *
 * These endpoints expose Jetpack module state through the portable `my-jetpack/v1` namespace so
 * the My Jetpack products page works identically on Simple, Atomic and self-hosted Jetpack sites
 * (mirroring how Jetpack Forms registers a locally-available route on every platform). The
 * existing `jetpack/v4/module/*` endpoints are unaffected.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Modules;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Jetpack modules.
 *
 * @phan-constructor-used-for-side-effects
 */
class REST_Modules {

	/**
	 * Constructor.
	 */
	public function __construct() {
		register_rest_route(
			'my-jetpack/v1',
			'site/modules',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( self::class, 'get_modules' ),
					'permission_callback' => array( self::class, 'view_permissions_callback' ),
				),
			)
		);

		register_rest_route(
			'my-jetpack/v1',
			'site/modules/(?P<slug>[a-z0-9\-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( self::class, 'set_module' ),
					'permission_callback' => array( self::class, 'edit_permissions_callback' ),
					'args'                => array(
						'slug'   => array(
							'description' => __( 'The module slug.', 'jetpack-my-jetpack' ),
							'type'        => 'string',
							'required'    => true,
						),
						'active' => array(
							'description' => __( 'Whether the module should be active.', 'jetpack-my-jetpack' ),
							'type'        => 'boolean',
							'required'    => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Permission check for reading module state.
	 *
	 * @return bool
	 */
	public static function view_permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Permission check for changing module state.
	 *
	 * @return bool
	 */
	public static function edit_permissions_callback() {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return false;
		}
		if ( is_multisite() && ! current_user_can( 'manage_network' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * GET callback: list the site's Jetpack modules and their state.
	 *
	 * On sites running the Jetpack plugin the list is built from the Modules class. On platforms
	 * without Jetpack modules (e.g. WordPress.com Simple) the base list is empty and the
	 * `my_jetpack_site_modules` filter lets the platform supply equivalent state.
	 *
	 * @return \WP_REST_Response
	 */
	public static function get_modules() {
		$modules          = array();
		$modules_instance = new Modules();

		foreach ( $modules_instance->get_available() as $slug ) {
			$info = $modules_instance->get( $slug );
			if ( ! is_array( $info ) ) {
				continue;
			}

			$modules[ $slug ] = array(
				'module'           => $slug,
				'name'             => $info['name'] ?? $slug,
				'description'      => $info['description'] ?? '',
				'long_description' => $info['long_description'] ?? '',
				'search_terms'     => $info['search_terms'] ?? '',
				'available'        => true,
				'activated'        => $modules_instance->is_active( $slug ),
			);
		}

		/**
		 * Filter the My Jetpack module list.
		 *
		 * Lets a platform (e.g. WordPress.com Simple, via a wpcom mu-plugin) supply or override
		 * module state when the Jetpack plugin's module system is not present.
		 *
		 * @since $$next-version$$
		 *
		 * @param array $modules Map of module slug => module data.
		 */
		$modules = apply_filters( 'my_jetpack_site_modules', $modules );

		return rest_ensure_response( $modules );
	}

	/**
	 * POST callback: activate or deactivate a single module.
	 *
	 * Routes through the Modules class when the module is real (Jetpack plugin present); otherwise
	 * delegates to the `my_jetpack_set_module` action so the platform can toggle its equivalent.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function set_module( WP_REST_Request $request ) {
		$slug   = $request->get_param( 'slug' );
		$active = (bool) $request->get_param( 'active' );

		$modules_instance = new Modules();

		// Only route through the Modules class for a real, available Jetpack module. Note we
		// can't use Modules::is_module() here: it relies on validate_file(), which treats any
		// slug as valid when the available-modules list is empty (e.g. on a site without the
		// Jetpack plugin), so it would wrongly claim every slug is a module.
		if ( in_array( $slug, $modules_instance->get_available(), true ) ) {
			$result = $active
				? $modules_instance->activate( $slug, false, false )
				: $modules_instance->deactivate( $slug );

			if ( ! $result ) {
				return new WP_Error(
					'my_jetpack_module_update_failed',
					esc_html(
						sprintf(
							/* translators: %s is the module slug. */
							__( 'Failed to update the %s module.', 'jetpack-my-jetpack' ),
							$slug
						)
					),
					array( 'status' => 500 )
				);
			}
		} else {
			/**
			 * Set the state of a non-Jetpack-plugin module.
			 *
			 * Lets a platform (e.g. WordPress.com Simple) toggle its equivalent of a Jetpack
			 * module when the Modules class cannot.
			 *
			 * @since $$next-version$$
			 *
			 * @param string $slug   The module slug.
			 * @param bool   $active Whether the module should be active.
			 */
			do_action( 'my_jetpack_set_module', $slug, $active );
		}

		return rest_ensure_response(
			array(
				'module'    => $slug,
				'activated' => $active,
			)
		);
	}
}
