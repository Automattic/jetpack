<?php
/**
 * Tests for the WordPress.com loader entry of the playlist routes.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;
use WP_REST_Server;

/**
 * Tests for WPCOM_REST_API_V3_Endpoint_VideoPress_Playlists.
 */
class WPCOM_REST_API_V3_Endpoint_VideoPress_Playlists_Test extends BaseTestCase {

	/**
	 * The rest_api_init hooks other tests left behind, set aside so they can't register the routes.
	 *
	 * @var mixed
	 */
	private $saved_rest_api_init;

	/**
	 * Start with an empty REST server and no rest_api_init hooks.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server, $wp_filter;
		$wp_rest_server            = new WP_REST_Server();
		$this->saved_rest_api_init = $wp_filter['rest_api_init'] ?? null;
		unset( $wp_filter['rest_api_init'] );
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		global $wp_rest_server, $wp_filter;
		$wp_rest_server = null;
		unset( $wp_filter['rest_api_init'] );
		if ( null !== $this->saved_rest_api_init ) {
			$wp_filter['rest_api_init'] = $this->saved_rest_api_init; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		}

		parent::tear_down();
	}

	/**
	 * WordPress.com reaches the playlist routes only through this class.
	 */
	public function test_registers_playlist_routes_under_wpcom_v3() {
		new WPCOM_REST_API_V3_Endpoint_VideoPress_Playlists();
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/wpcom/v3/videopress/playlists', $routes );
		$this->assertArrayHasKey( '/wpcom/v3/videopress/playlists/(?P<key>' . Playlist_Manager::KEY_PATTERN . ')', $routes );
	}
}
