<?php
/**
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: https://jetpack.com
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 8.6.1
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 *
 * @package Jetpack
 */

define( 'JETPACK__MINIMUM_WP_VERSION', '5.3' );
define( 'JETPACK__MINIMUM_PHP_VERSION', '5.6' );
define( 'JETPACK__VERSION', '8.6.1' );
define( 'JETPACK_MASTER_USER', true );
define( 'JETPACK__API_VERSION', 1 );
define( 'JETPACK__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JETPACK__PLUGIN_FILE', __FILE__ );

defined( 'JETPACK__RELEASE_POST_BLOG_SLUG' ) || define( 'JETPACK__RELEASE_POST_BLOG_SLUG', 'jetpackreleaseblog.wordpress.com' );
defined( 'JETPACK_CLIENT__AUTH_LOCATION' ) || define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' ) || define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) || define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );
defined( 'JETPACK__API_BASE' ) || define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
defined( 'JETPACK_PROTECT__API_HOST' ) || define( 'JETPACK_PROTECT__API_HOST', 'https://api.bruteprotect.com/' );
defined( 'JETPACK__WPCOM_JSON_API_HOST' ) || define( 'JETPACK__WPCOM_JSON_API_HOST', 'public-api.wordpress.com' );
defined( 'JETPACK__SANDBOX_DOMAIN' ) || define( 'JETPACK__SANDBOX_DOMAIN', '' );
defined( 'JETPACK__DEBUGGER_PUBLIC_KEY' ) || define(
	'JETPACK__DEBUGGER_PUBLIC_KEY',
	"\r\n" . '-----BEGIN PUBLIC KEY-----' . "\r\n"
	. 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAm+uLLVoxGCY71LS6KFc6' . "\r\n"
	. '1UnF6QGBAsi5XF8ty9kR3/voqfOkpW+gRerM2Kyjy6DPCOmzhZj7BFGtxSV2ZoMX' . "\r\n"
	. '9ZwWxzXhl/Q/6k8jg8BoY1QL6L2K76icXJu80b+RDIqvOfJruaAeBg1Q9NyeYqLY' . "\r\n"
	. 'lEVzN2vIwcFYl+MrP/g6Bc2co7Jcbli+tpNIxg4Z+Hnhbs7OJ3STQLmEryLpAxQO' . "\r\n"
	. 'q8cbhQkMx+FyQhxzSwtXYI/ClCUmTnzcKk7SgGvEjoKGAmngILiVuEJ4bm7Q1yok' . "\r\n"
	. 'xl9+wcfW6JAituNhml9dlHCWnn9D3+j8pxStHihKy2gVMwiFRjLEeD8K/7JVGkb/' . "\r\n"
	. 'EwIDAQAB' . "\r\n"
	. '-----END PUBLIC KEY-----' . "\r\n"
);

/*
 * These constants can be set in wp-config.php to ensure sites behind proxies will still work.
 * Setting these constants, though, is *not* the preferred method. It's better to configure
 * the proxy to send the X-Forwarded-Port header.
 */
defined( 'JETPACK_SIGNATURE__HTTP_PORT' ) || define( 'JETPACK_SIGNATURE__HTTP_PORT', 80 );
defined( 'JETPACK_SIGNATURE__HTTPS_PORT' ) || define( 'JETPACK_SIGNATURE__HTTPS_PORT', 443 );

/**
 * Check if the version of WordPress in use on the site is supported by Jetpack.
 */
if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				/* translators: Placeholders are numbers, versions of WordPress in use on the site, and required by WordPress. */
				esc_html__( 'Your version of WordPress (%1$s) is lower than the version required by Jetpack (%2$s). Please update WordPress to continue enjoying Jetpack.', 'jetpack' ),
				$GLOBALS['wp_version'],
				JETPACK__MINIMUM_WP_VERSION
			)
		);
	}

	/**
	 * Outputs for an admin notice about running Jetpack on outdated WordPress.
	 *
	 * @since 7.2.0
	 */
	function jetpack_admin_unsupported_wp_notice() { ?>
		<div class="notice notice-error is-dismissible">
			<p><?php esc_html_e( 'Jetpack requires a more recent version of WordPress and has been paused. Please update WordPress to continue enjoying Jetpack.', 'jetpack' ); ?></p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'jetpack_admin_unsupported_wp_notice' );
	return;
}

/**
 * This is where the loading of Jetpack begins.
 *
 * First, we try to load our composer autoloader.
 *
 * - If it fails, we "pause" Jetpack by ending the loading process
 *   and displaying an admin_notice to inform the site owner.
 *   (We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.)
 * - If it succeeds, we require load-jetpack.php, where all legacy files are required,
 *   and where we add on to various hooks that we expect to always run.
 */
$jetpack_autoloader = JETPACK__PLUGIN_DIR . 'vendor/autoload_packages.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to this document to set up your development environment: %1$s', 'jetpack' ),
				'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md'
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running Jetpack without having run composer install.
	 *
	 * @since 7.4.0
	 */
	function jetpack_admin_missing_autoloader() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
				printf(
					wp_kses(
						/* translators: Placeholder is a link to a support document. */
						__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack' ),
						array(
							'a' => array(
								'href'   => array(),
								'target' => array(),
								'rel'    => array(),
							),
						)
					),
					'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md'
				);
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'jetpack_admin_missing_autoloader' );
	return;
}

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );

// Require everything else, that is not loaded via the autoloader.
require_once JETPACK__PLUGIN_DIR . 'load-jetpack.php';
