<?php
/**
 * REST controller for locally-derived site state.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use WP_REST_Server;

/**
 * Exposes local site state needed by the dashboard.
 */
class Site_State_Controller {

	/**
	 * Package slug, used as the REST namespace root.
	 *
	 * @var string
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * REST namespace.
	 *
	 * @var string
	 */
	private $namespace;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = self::SLUG . '/v1';
	}

	/**
	 * Hook the controller's routes onto rest_api_init.
	 *
	 * @return void
	 */
	public static function register(): void {
		$controller = new self();
		add_action( 'rest_api_init', array( $controller, 'register_routes' ) );
	}

	/**
	 * Register site state routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/site/has-never-published-post',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'has_never_published_post' ),
				'permission_callback' => array( $this, 'check_permission' ),
			)
		);
	}

	/**
	 * Whether the current user may read site state.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Whether the site has never published a post or page.
	 *
	 * @return bool
	 */
	public function has_never_published_post(): bool {
		return 0 === $this->count_published( 'post' ) && 0 === $this->count_published( 'page' );
	}

	/**
	 * Count published entries for a post type.
	 *
	 * @param string $post_type Post type.
	 *
	 * @return int
	 */
	private function count_published( string $post_type ): int {
		$counts = wp_count_posts( $post_type );

		return isset( $counts->publish ) ? (int) $counts->publish : 0;
	}
}
