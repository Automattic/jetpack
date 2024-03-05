<?php
/**
 * Site Migration API endpoint
 *
 * @package automattic/jetpack-mu-wpcom
 * @since 1.1.0
 */

/**
 * Fetches site migration data.
 *
 * @since 1.1.0
 */
class WPCOM_REST_API_V2_Endpoint_Site_Migration extends WP_REST_Controller {

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'site-migration';

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register our routes.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_data' ),
					'permission_callback' => array( $this, 'can_access' ),
				),
			)
		);
	}

	/**
	 * Permission callback for the REST route.
	 *
	 * @return boolean
	 */
	public function can_access() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Returns the migration key.
	 *
	 * @return string
	 */
	private function get_migration_key() {
		// Only fetch the key if we have the classes.
		if ( class_exists( 'MGWPSettings' ) && class_exists( 'MGInfo' ) ) {
			$migrate_guru_settings = new MGWPSettings();
			$migrate_guru_info     = new MGInfo( $migrate_guru_settings );

			return $migrate_guru_info->getConnectionKey();
		}

		return '';
	}

	/**
	 * Returns Launchpad-related options.
	 *
	 * @return array Associative array with `migration_key`.
	 */
	public function get_data() {
		return array(
			'migration_key' => $this->get_migration_key(),
		);
	}
}

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Site_Migration' );
