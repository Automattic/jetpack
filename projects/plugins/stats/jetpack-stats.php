<?php
/**
 *
 * Plugin Name: Jetpack Stats
 * Plugin URI: https://jetpack.com/stats/
 * Description: Simple, yet powerful stats to grow your site.
 * Version: 0.1.0-alpha
 * Author: Automattic - Jetpack Stats team
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Requires at least: 6.9
 * Requires PHP: 7.2
 * Text Domain: jetpack-stats
 *
 * @package automattic/jetpack-stats-plugin
 */

namespace Automattic\Jetpack\Stats_Plugin;

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Constant definitions.
define( 'JETPACK_STATS_PLUGIN__DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_STATS_PLUGIN__FILE', __FILE__ );
define( 'JETPACK_STATS_PLUGIN__FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_STATS_PLUGIN__SLUG', 'jetpack-stats' );
define( 'JETPACK_STATS_PLUGIN__VERSION', '0.1.0-alpha' );
defined( 'JETPACK_CLIENT__AUTH_LOCATION' ) || define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );

defined( 'JETPACK__API_BASE' ) || define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
defined( 'JETPACK__WPCOM_JSON_API_BASE' ) || define( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

defined( 'JETPACK__SANDBOX_DOMAIN' ) || define( 'JETPACK__SANDBOX_DOMAIN', '' );

/*
 * These constants can be set in wp-config.php to ensure sites behind proxies will still work.
 * Setting these constants, though, is *not* the preferred method. It's better to configure
 * the proxy to send the X-Forwarded-Port header.
 */
defined( 'JETPACK_SIGNATURE__HTTP_PORT' ) || define( 'JETPACK_SIGNATURE__HTTP_PORT', 80 );
defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) || define( 'JETPACK_SIGNATURE__HTTPS_PORT', 443 );

$jetpack_stats_autoload_packages_path = JETPACK_STATS_PLUGIN__DIR . 'vendor/autoload_packages.php';
if ( ! is_readable( $jetpack_stats_autoload_packages_path ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
			/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Stats is incomplete. If you installed Jetpack Stats from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack-stats' ),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md'
			)
		);
	}

	// Add a red bubble notification to My Jetpack if the installation is bad.
	add_filter(
		'my_jetpack_red_bubble_notification_slugs',
		function ( $slugs ) {
			$slugs['jetpack-stats-plugin-bad-installation'] = array(
				'data' => array(
					'plugin' => 'Jetpack Stats',
				),
			);

			return $slugs;
		}
	);

	/**
	 * Outputs an admin notice for folks running Jetpack Stats without having run composer install.
	 *
	 * @since $$next-version$$
	 */
	function jetpack_stats_admin_missing_files() {
		if ( get_current_screen()->id !== 'plugins' ) {
			return;
		}

		$message = sprintf(
			wp_kses(
				/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Stats is incomplete. If you installed Jetpack Stats from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Stats must have Composer dependencies installed and built via the build command.', 'jetpack-stats' ),
				array(
					'a' => array(
						'href'   => array(),
						'target' => array(),
						'rel'    => array(),
					),
				)
			),
			'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#building-your-project'
		);
		wp_admin_notice(
			$message,
			array(
				'type'        => 'error',
				'dismissible' => true,
			)
		);
	}

	add_action( 'admin_notices', __NAMESPACE__ . '\jetpack_stats_admin_missing_files' );
	return;
}

/**
 * Setup autoloading
 */
require_once $jetpack_stats_autoload_packages_path;

/**
 * Load jetpack packages i18n map.
 *
 * The map is only generated when `.extra.wp-plugin-slug` is set in composer.json, which
 * happens once this plugin is published to the WordPress.org directory. Until then the
 * file is absent, and `alias_textdomains_from_file()` would fatal on a bare `require`.
 */
$jetpack_stats_i18n_map_path = JETPACK_STATS_PLUGIN__DIR . 'jetpack_vendor/i18n-map.php';
if ( is_readable( $jetpack_stats_i18n_map_path ) && method_exists( Assets::class, 'alias_textdomains_from_file' ) ) {
	Assets::alias_textdomains_from_file( $jetpack_stats_i18n_map_path );
}

Jetpack_Stats_Plugin::bootstrap();
