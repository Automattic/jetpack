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
 * Reports whether one plugin is installed, and whether it is active.
 *
 * WordPress.com polls this while installing a marketplace plugin. The plugin-list endpoint
 * answers the same question by refreshing update transients and formatting every installed
 * plugin; this reads one directory.
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
	 * Allow only blog-token-signed requests: WordPress.com acting on the site, not a user.
	 * The caller checks the end user's capability.
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
	 * Validate the slug.
	 *
	 * The route pattern is not enough on its own: WP_REST_Server matches routes with the `i`
	 * flag, so it admits uppercase, and `.` and `..` are spelled with characters it allows.
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
	 * Report the plugin's state. An absent plugin is a 200, not a failure.
	 *
	 * @param WP_REST_Request $request The request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_plugin_state( $request ) {
		$slug = (string) $request['plugin_slug'];

		if ( ! function_exists( 'get_plugin_data' ) || ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$plugin_file = $this->find_bootstrap_file( $slug );

		if ( null === $plugin_file ) {
			return rest_ensure_response(
				array(
					'slug'      => $slug,
					'installed' => false,
				)
			);
		}

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

	/**
	 * Find the plugin's bootstrap file, relative to WP_PLUGIN_DIR.
	 *
	 * Only a file directly inside the plugin's directory can be its bootstrap, which is why
	 * get_plugins() is not used here: pointed at a single directory it also descends a level and
	 * parses the header of every nested PHP file only to have them discarded -- hundreds of reads
	 * for a large plugin. Its cache group is non-persistent, so a polling caller pays that on
	 * every request.
	 *
	 * @param string $slug The plugin's directory slug.
	 *
	 * @return string|null The plugin file, or null when the directory holds no plugin.
	 */
	private function find_bootstrap_file( $slug ) {
		// The slug is validated, so it carries no glob wildcard.
		$candidates = glob( WP_PLUGIN_DIR . '/' . $slug . '/*.php' );

		if ( ! $candidates ) {
			return null;
		}

		$names = array();
		foreach ( $candidates as $path ) {
			if ( ! is_readable( $path ) ) {
				continue;
			}

			// Skip markup and translation, as get_plugins() does.
			$data = get_plugin_data( $path, false, false );

			if ( ! empty( $data['Name'] ) ) {
				$names[ basename( $path ) ] = $data['Name'];
			}
		}

		if ( ! $names ) {
			return null;
		}

		// get_plugins() orders by display name and the plugin list takes the first; match that.
		uasort( $names, 'strnatcasecmp' );

		return $slug . '/' . array_key_first( $names );
	}
}
