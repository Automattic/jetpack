<?php
/**
 * REST controller for the Stats settings drawer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\REST;

use Automattic\Jetpack\Stats\Settings_Screen;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Exposes `jetpack-premium-analytics/v1/settings` (GET + POST).
 *
 * The values are read and validated by {@see Settings_Screen}, which the Odyssey route in `stats-admin` shares.
 */
class Settings_Controller {

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
	 * Register the settings route.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		register_rest_route(
			$this->namespace,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'check_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'check_permission' ),
					'args'                => Settings_Screen::get_rest_args(),
				),
			)
		);
	}

	/**
	 * Only administrators may read or change the settings, because `roles` decides who else can view Stats.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get the current settings and the roles the drawer lists.
	 *
	 * @return array
	 */
	public function get_settings(): array {
		return $this->with_modules_url( Settings_Screen::get() );
	}

	/**
	 * Save the settings in the request.
	 *
	 * @param WP_REST_Request $request Request object.
	 * @return array|WP_Error The settings after the save, or why the values were refused.
	 */
	public function update_settings( WP_REST_Request $request ) {
		$result = Settings_Screen::update( $request->get_params() );

		return is_wp_error( $result ) ? $result : $this->with_modules_url( $result );
	}

	/**
	 * Add where Stats is switched off: the Jetpack plugin's modules screen, when that plugin is active.
	 *
	 * @param array $response The settings response.
	 * @return array
	 */
	private function with_modules_url( array $response ): array {
		$response['modules_url'] = class_exists( 'Jetpack' ) ? admin_url( 'admin.php?page=jetpack_modules' ) : null;

		return $response;
	}
}
