<?php
/**
 * Jetpack Boost Plugin
 *
 * @link              https://automattic.com
 * @since             0.1.0
 *
 * @wordpress-plugin
 * Plugin Name:       Jetpack Boost
 * Plugin URI:        https://jetpack.com/boost
 * Description:       Boost your WordPress site's performance, from the creators of Jetpack
 * Version: 1.8.0
 * Author:            Automattic - Jetpack Site Speed team
 * Author URI:        https://jetpack.com/boost/
 * License:           GPL-2.0+
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       jetpack-boost
 * Domain Path:       /languages
 * Requires at least: 5.5
 * Requires PHP:      7.0
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost;

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'JETPACK_BOOST_VERSION', '1.8.0' );
define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );

if ( ! defined( 'JETPACK_BOOST_CLIENT_NAME' ) ) {
	define( 'JETPACK_BOOST_CLIENT_NAME', 'jetpack-boost-wp-plugin' );
}

define( 'JETPACK_BOOST_DIR_PATH', __DIR__ );
define( 'JETPACK_BOOST_PATH', __FILE__ );

if ( ! defined( 'JETPACK_BOOST_PLUGIN_BASE' ) ) {
	define( 'JETPACK_BOOST_PLUGIN_BASE', plugin_basename( __FILE__ ) );
}

if ( ! defined( 'JETPACK_BOOST_REST_NAMESPACE' ) ) {
	define( 'JETPACK_BOOST_REST_NAMESPACE', 'jetpack-boost/v1' );
}

// For use in situations where you want additional namespacing.
if ( ! defined( 'JETPACK_BOOST_REST_PREFIX' ) ) {
	define( 'JETPACK_BOOST_REST_PREFIX', '' );
}

if ( ! defined( 'JETPACK__WPCOM_JSON_API_BASE' ) ) {
	define( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
}

if ( ! defined( 'JETPACK_BOOST_PLUGINS_DIR_URL' ) ) {
	define( 'JETPACK_BOOST_PLUGINS_DIR_URL', plugin_dir_url( __FILE__ ) );
}
/**
 * Setup autoloading
 */
$boost_packages_path = JETPACK_BOOST_DIR_PATH . '/vendor/autoload_packages.php';
if ( is_readable( $boost_packages_path ) ) {
	require_once $boost_packages_path;
	if ( method_exists( \Automattic\Jetpack\Assets::class, 'alias_textdomains_from_file' ) ) {
		\Automattic\Jetpack\Assets::alias_textdomains_from_file( JETPACK_BOOST_DIR_PATH . '/jetpack_vendor/i18n-map.php' );
	}
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
			/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack Boost is incomplete. If you installed Jetpack Boost from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack-boost' ),
				'https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md'
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running Jetpack Boost without having run composer install.
	 *
	 * @since 1.2.0
	 */
	function jetpack_boost_admin_missing_files() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
					/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack Boost is incomplete. If you installed Jetpack Boost from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment. Jetpack Boost must have Composer dependencies installed and built via the build command.', 'jetpack-boost' ),
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

	add_action( 'admin_notices', 'jetpack_boost_admin_missing_files' );
	return;
}

require plugin_dir_path( __FILE__ ) . 'app/class-jetpack-boost.php';

/**
 * Begins execution of the plugin.
 *
 * @since 0.1.0
 */
function run_jetpack_boost() {
	new Jetpack_Boost();
}

add_action( 'plugins_loaded', '\Automattic\Jetpack_Boost\run_jetpack_boost', 1 );

register_activation_hook( __FILE__, array( 'Automattic\Jetpack_Boost\Jetpack_Boost', 'activate' ) );

// Redirect to plugin page when the plugin is activated.
add_action( 'activated_plugin', __NAMESPACE__ . '\jetpack_boost_plugin_activation' );

/**
 * Redirects to plugin page when the plugin is activated
 *
 * @access public
 * @static
 *
 * @param string $plugin Path to the plugin file relative to the plugins directory.
 */
function jetpack_boost_plugin_activation( $plugin ) {
	if (
		JETPACK_BOOST_PLUGIN_BASE === $plugin &&
		\Automattic\Jetpack\Plugins_Installer::is_current_request_activating_plugin_from_plugins_screen( JETPACK_BOOST_PLUGIN_BASE )
	) {
		wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-boost' ) ) );
		exit;
	}
}

/**
 * Extra tweaks to make Jetpack Boost work better with others.
 */
function include_compatibility_files() {
	if ( class_exists( 'Jetpack' ) ) {
		require_once __DIR__ . '/compatibility/jetpack.php';
	}

	if ( class_exists( 'WooCommerce' ) ) {
		require_once __DIR__ . '/compatibility/woocommerce.php';
	}

	if ( class_exists( '\Google\Web_Stories\Plugin' ) ) {
		require_once __DIR__ . '/compatibility/web-stories.php';
	}

	if ( class_exists( '\Elementor\TemplateLibrary\Source_Local' ) ) {
		require_once __DIR__ . '/compatibility/elementor.php';
	}

	if ( function_exists( 'amp_is_request' ) ) {
		require_once __DIR__ . '/compatibility/amp.php';
	}

	if ( function_exists( 'wp_cache_is_enabled' ) ) {
		require_once __DIR__ . '/compatibility/wp-super-cache.php';
	}
}

add_action( 'plugins_loaded', __NAMESPACE__ . '\include_compatibility_files' );

register_uninstall_hook( __FILE__, 'Automattic\Jetpack_Boost\jetpack_boost_uninstall' );
/**
 * Clean up when uninstalling Jetpack Boost
 */
function jetpack_boost_uninstall() {
	$boost = new Jetpack_Boost();
	$boost->uninstall();
}

/**
 * Previous version compatibility files
 */
require_once __DIR__ . '/compatibility/boost-1.3.1.php';
require_once __DIR__ . '/wp-js-data-sync.php';
