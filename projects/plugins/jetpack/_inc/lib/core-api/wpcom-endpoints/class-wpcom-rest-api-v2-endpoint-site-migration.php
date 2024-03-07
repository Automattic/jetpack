<?php
/**
 * Allow us to access the Migrate Guru site migration key via API.
 *
 * @package automattic/jetpack
 */

/**
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */
class WPCOM_REST_API_V2_Endpoint_Site_Migration {
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
