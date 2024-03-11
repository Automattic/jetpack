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
class WPCOM_REST_API_V2_Endpoint_Site_Migration_Migrate_Guru_Key extends WP_REST_Controller {
	/**
	 * Option name that tracks wether the key has been read or not.
	 * The only possible value for the option is 'read'.
	 *
	 * @var string
	 */
	protected $key_is_read_option_name = 'wpcom_site_migration_migrate_guru_key_read';

	/**
	 * Class constructor
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'atomic-migration-status/migrate-guru-key';

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
		if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
			return false;
		}

		if ( ! ( new Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
			return false;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! is_plugin_active( 'migrate-guru/migrateguru.php' ) ) {
			return false;
		}

		if ( ! class_exists( 'MGWPSettings' ) || ! class_exists( 'MGInfo' ) ) {
			return false;
		}

		if ( 'read' === get_option( $this->key_is_read_option_name, false ) ) {
			return false;
		}

		return true;
	}

	/**
	 * Returns the migration key.
	 *
	 * @return string
	 */
	private function get_migration_key() {
		$migrate_guru_settings = new MGWPSettings();
		$migrate_guru_info     = new MGInfo( $migrate_guru_settings );

		update_option( $this->key_is_read_option_name, 'read' );

		return $migrate_guru_info->getConnectionKey();
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

wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Endpoint_Site_Migration_Migrate_Guru_Key' );
