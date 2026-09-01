<?php
/**
 * Primary class file for the Jetpack_WPCloud_SSO plugin.
 *
 * @package automattic/jetpack-wpcloud-sso
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Sync\Data_Settings;

/**
 * Class Jetpack_WPCloud_SSO
 *
 * @phan-constructor-used-for-side-effects
 */
class Jetpack_WPCloud_SSO {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_WPCLOUD_SSO_SLUG,
						'name'     => JETPACK_WPCLOUD_SSO_NAME,
						'url_info' => JETPACK_WPCLOUD_SSO_URI,
					)
				);

				// Sync package.
				$must_sync_data = Data_Settings::MUST_SYNC_DATA_SETTINGS;
				// Add additional modules.
				$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Plugins';
				$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Users';
				$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Meta';
				$must_sync_data['jetpack_sync_modules'][] = 'Automattic\\Jetpack\\Sync\\Modules\\Stats';
				$config->ensure( 'sync', $must_sync_data );

				// Read persisistent data and establish connection.
				if ( class_exists( 'Atomic_Persistent_Data' ) ) {
					$persistent_data = new Atomic_Persistent_Data(); // @phan-suppress-current-line PhanUndeclaredClassMethod -- wrapped in a class_exists() check
					$jetpack_config  = array(
						'blog_id'            => $persistent_data->wpcom_blog_id, // @phan-suppress-current-line PhanUndeclaredClassProperty -- wrapped in a class_exists() check
						'blog_token'         => $persistent_data->jetpack_blog_token, // @phan-suppress-current-line PhanUndeclaredClassProperty -- wrapped in a class_exists() check
						'primary_user_token' => $persistent_data->jetpack_user_token, // @phan-suppress-current-line PhanUndeclaredClassProperty -- wrapped in a class_exists() check
					);

					if ( ! class_exists( 'Jetpack_Options' ) ) {
						print_r( 'no Jetpack_Options' ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
					} else {
						$has_blog_id    = Jetpack_Options::get_option( 'id' ) === $jetpack_config['blog_id'];
						$has_blog_token = Jetpack_Options::get_option( 'blog_token' ) === $jetpack_config['blog_token'];

						if ( ! $has_blog_id || ! $has_blog_token ) {
							// Set the WordPress.com blog ID & blog token.
							Jetpack_Options::update_option( 'id', $jetpack_config['blog_id'] );
							Jetpack_Options::update_option( 'blog_token', $jetpack_config['blog_token'] );

							// Set up the primary user connection.
							$user_id                 = 1; // Assuming user ID 1 is the primary user for now, in the future can check based off of the garden bot email.
							$user_tokens             = Jetpack_Options::get_option( 'user_tokens', array() );
							$user_tokens[ $user_id ] = $jetpack_config['primary_user_token'] . '.' . $user_id;
							Jetpack_Options::update_option( 'user_tokens', $user_tokens );
							Jetpack_Options::update_option( 'master_user', $user_id );

							add_filter( 'jetpack_sso_match_by_email', '__return_true' );
						}
					}
				}

				// Use SSO
				Automattic\Jetpack\Connection\SSO::get_instance();
			},
			1
		);
	}

	/**
	 * * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-wpcloud-sso' );
		$manager->remove_connection();
	}
}
