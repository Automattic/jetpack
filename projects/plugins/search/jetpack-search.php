<?php
/**
 *
 * Plugin Name: Jetpack Search
 * Plugin URI: https://jetpack.com/search/
 * Description: Easily add cloud-powered instant search and filters to your website or WooCommerce store with advanced algorithms that boost your search results based on traffic to your site.
 * Version: 1.4.2-alpha
 * Author: Automattic - Jetpack Search team
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-search
 *
 * @package automattic/jetpack-search-plugin
 */

namespace Automattic\Jetpack\Search_Plugin;

use Automattic\Jetpack\Assets;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Constant definitions.
define( 'JETPACK_SEARCH_PLUGIN__DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK_SEARCH_PLUGIN__FILE', __FILE__ );
define( 'JETPACK_SEARCH_PLUGIN__FILE_RELATIVE_PATH', plugin_basename( __FILE__ ) );
define( 'JETPACK_SEARCH_PLUGIN__SLUG', 'jetpack-search' );
define( 'JETPACK_SEARCH_PLUGIN__VERSION', '1.4.2-alpha' );

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

$autoload_packages_path = JETPACK_SEARCH_PLUGIN__DIR . '/vendor/autoload_packages.php';
if ( ! is_readable( $autoload_packages_path ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
			/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Search is incomplete. If you installed Jetpack Search from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack-search' ),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md'
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running Jetpack Search without having run composer install.
	 *
	 * @since 1.2.0
	 */
	function jetpack_search_admin_missing_files() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
					/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Search is incomplete. If you installed Jetpack Search from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Search must have Composer dependencies installed and built via the build command.', 'jetpack-search' ),
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
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', __NAMESPACE__ . '\jetpack_search_admin_missing_files' );
	return;
}

/**
 * Setup autoloading
 */
require_once $autoload_packages_path;

/**
 * Load jetpack packages i18n map.
 */
if ( method_exists( Assets::class, 'alias_textdomains_from_file' ) ) {
	Assets::alias_textdomains_from_file( JETPACK_SEARCH_PLUGIN__DIR . '/jetpack_vendor/i18n-map.php' );
}

Jetpack_Search_Plugin::bootstrap();
