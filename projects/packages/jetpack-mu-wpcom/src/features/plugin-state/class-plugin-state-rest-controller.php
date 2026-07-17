<?php
/**
 * Reports the state of a single plugin to WordPress.com.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Plugin_State;

use Automattic\Jetpack\Connection\Rest_Authentication;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Answers whether one plugin is installed on this site, and whether it is active.
 *
 * WordPress.com polls this while it installs a marketplace plugin. The question is
 * narrow enough that the general plugin-list endpoint is the wrong tool for it: that
 * endpoint refreshes update transients and formats every installed plugin in order to
 * report on one of them. This reads a single directory and returns four fields.
 */
class Plugin_State_REST_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'plugin-state';
	}

	/**
	 * Register the route.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<plugin_slug>[a-z0-9_.-]+)',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_plugin_state' ),
					'permission_callback' => array( $this, 'permissions_check' ),
					'args'                => array(
						'plugin_slug' => array(
							'description'       => __( "The plugin's WordPress.org directory slug.", 'jetpack-mu-wpcom' ),
							'type'              => 'string',
							'required'          => true,
							'validate_callback' => array( $this, 'validate_plugin_slug' ),
						),
					),
				),
			)
		);
	}

	/**
	 * Only WordPress.com itself may ask, and only with this site's blog token.
	 *
	 * The end user's capability to install plugins is the caller's to check; what this
	 * guards is that the request really is WordPress.com acting on the site. A user token
	 * is refused as firmly as no token at all -- `is_signed_with_blog_token()` reports the
	 * token type, not merely that some valid token was present.
	 *
	 * @return true|WP_Error
	 */
	public function permissions_check() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			__( 'You are not allowed to perform this action.', 'jetpack-mu-wpcom' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * Validate the requested slug.
	 *
	 * The route pattern alone would not be enough. WP_REST_Server matches routes with the
	 * `i` flag, so `[a-z0-9_.-]+` admits an uppercase slug, and the relative segments `.`
	 * (the plugins directory itself) and `..` (its parent) are spelled entirely with
	 * characters the pattern allows. Both would otherwise reach get_plugins() as a path.
	 *
	 * @param mixed $value The submitted slug.
	 *
	 * @return true|WP_Error
	 */
	public function validate_plugin_slug( $value ) {
		if ( ! is_string( $value )
			|| ! preg_match( '/^[a-z0-9_.-]+$/', $value )
			|| '.' === $value
			|| '..' === $value
		) {
			return new WP_Error(
				'rest_invalid_plugin_slug',
				__( 'The plugin slug is not a valid WordPress.org directory slug.', 'jetpack-mu-wpcom' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Report whether the plugin is installed, and whether it is active.
	 *
	 * Read-only, and deliberately cheap: no update check, no autoupdate eligibility, no
	 * action links, no uninstall check. An absent plugin is a state rather than a failure,
	 * so it is reported as a 200 whose `installed` is false.
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_plugin_state( $request ) {
		$slug = (string) $request['plugin_slug'];

		if ( ! function_exists( 'get_plugins' ) || ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		/*
		 * Scoping get_plugins() to the one directory keeps the work proportional to that
		 * plugin's files rather than to everything the site has installed. A directory that
		 * is missing, or that holds no file with a plugin header, comes back empty.
		 */
		$plugin_files = array_keys( get_plugins( '/' . $slug ) );

		if ( ! $plugin_files ) {
			return rest_ensure_response(
				array(
					'slug'      => $slug,
					'installed' => false,
				)
			);
		}

		// get_plugins() returns files relative to the directory it was given, so `give.php`
		// here means `give/give.php`. Taking the first entry matches the plugin-list endpoint.
		$plugin_file = $slug . '/' . reset( $plugin_files );

		return rest_ensure_response(
			array(
				'slug'      => $slug,
				'installed' => true,
				'id'        => preg_replace( '/\.php$/', '', $plugin_file ),
				// Core's check, which already counts a network-activated plugin as active.
				'active'    => is_plugin_active( $plugin_file ),
			)
		);
	}
}
