<?php

/*
 * Plugin Name: Jetpack by WordPress.com
 * Plugin URI: https://jetpack.com
 * Description: Bring the power of the WordPress.com cloud to your self-hosted WordPress. Jetpack enables you to connect your blog to a WordPress.com account to use the powerful features normally only available to WordPress.com users.
 * Author: Automattic
 * Version: 7.4.1
 * Author URI: https://jetpack.com
 * License: GPL2+
 * Text Domain: jetpack
 * Domain Path: /languages/
 */

define( 'JETPACK__MINIMUM_WP_VERSION', '5.1' );
define( 'JETPACK__MINIMUM_PHP_VERSION', '5.3.2' );

define( 'JETPACK__VERSION',            '7.4.1' );
define( 'JETPACK_MASTER_USER',         true );
define( 'JETPACK__API_VERSION',        1 );
define( 'JETPACK__PLUGIN_DIR',         plugin_dir_path( __FILE__ ) );
define( 'JETPACK__PLUGIN_FILE',        __FILE__ );

defined( 'JETPACK_CLIENT__AUTH_LOCATION' )   or define( 'JETPACK_CLIENT__AUTH_LOCATION', 'header' );
defined( 'JETPACK_CLIENT__HTTPS' )           or define( 'JETPACK_CLIENT__HTTPS', 'AUTO' );
defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) or define( 'JETPACK__GLOTPRESS_LOCALES_PATH', JETPACK__PLUGIN_DIR . 'locales.php' );
defined( 'JETPACK__API_BASE' )               or define( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );
defined( 'JETPACK_PROTECT__API_HOST' )       or define( 'JETPACK_PROTECT__API_HOST', 'https://api.bruteprotect.com/' );
defined( 'JETPACK__WPCOM_JSON_API_HOST' )    or define( 'JETPACK__WPCOM_JSON_API_HOST', 'public-api.wordpress.com' );

defined( 'JETPACK__SANDBOX_DOMAIN' ) or define( 'JETPACK__SANDBOX_DOMAIN', '' );

defined( 'JETPACK__DEBUGGER_PUBLIC_KEY' ) or define(
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

/**
 * Returns the location of Jetpack's lib directory. This filter is applied
 * in require_lib().
 *
 * @since 4.0.2
 *
 * @return string Location of Jetpack library directory.
 *
 * @filter require_lib_dir
 */
function jetpack_require_lib_dir() {
	return JETPACK__PLUGIN_DIR . '_inc/lib';
}


/**
 * Checks if the code debug mode turned on, and returns false if it is. When Jetpack is in
 * code debug mode, it shouldn't use minified assets. Note that this filter is not being used
 * in every place where assets are enqueued. The filter is added at priority 9 to be overridden
 * by any default priority filter that runs after it.
 *
 * @since 6.2.0
 *
 * @return boolean
 *
 * @filter jetpack_should_use_minified_assets
 */
function jetpack_should_use_minified_assets() {
	if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
		return false;
	}
	return true;
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

if ( version_compare( $GLOBALS['wp_version'], JETPACK__MINIMUM_WP_VERSION, '<' ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			sprintf(
				/* translators: Placeholders are numbers, versions of WordPress in use on the site, and required by WordPress. */
				esc_html__( 'Your version of WordPress (%1$s) is lower than the version required by Jetpack (%2$s). Please update WordPress to continue enjoying Jetpack.', 'jetpack' ),
				$GLOBALS['wp_version'],
				JETPACK__MINIMUM_WP_VERSION
			)
		);
	}
	add_action( 'admin_notices', 'jetpack_admin_unsupported_wp_notice' );
	return;
}

/**
 * Outputs an admin notice for folks running an outdated version of PHP.
 * @todo: Remove once WP 5.2 is the minimum version.
 *
 * @since 7.4.0
 */
function jetpack_admin_unsupported_php_notice() { ?>
	<div class="notice notice-error is-dismissible">
		<p><?php esc_html_e( 'Jetpack requires a more recent version of PHP and has been paused. Please update PHP to continue enjoying Jetpack.', 'jetpack' ); ?></p>
		<p class="button-container">
		<?php
		printf(
			'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
			esc_url( wp_get_update_php_url() ),
			__( 'Learn more about updating PHP' ),
			/* translators: accessibility text */
			__( '(opens in a new tab)' )
		);
		?>
	</p>
	</div>
	<?php
}

/**
 * Outputs an admin notice for folks running Jetpack without having run composer install.
 *
 * @since 7.4.0
 */
function jetpack_admin_missing_autoloader() { ?>
	<div class="notice notice-error is-dismissible">
		<p>
		<?php
		printf(
			/* translators: Placeholder is a link to a support document. */
			__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack' ),
			esc_url( 'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md' )
		);
		?>
		</p>
	</p>
	</div>
	<?php
}

/**
 * This is where the loading of Jetpack begins.
 *
 * First, we check for our supported version of PHP and load our composer autoloader. If either of these fail,
 * we "pause" Jetpack by ending the loading process and displaying an admin_notice to inform the site owner.
 *
 * After both those things happen successfully, we require the legacy files, then add on to various hooks that we expect
 * to always run.
 *
 * Lastly, we fire Jetpack::init() to fire up the engines.
 */
if ( version_compare( phpversion(), JETPACK__MINIMUM_PHP_VERSION, '<' ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			sprintf(
				/* translators: Placeholders are numbers, versions of PHP in use on the site, and required by Jetpack. */
				esc_html__( 'Your version of PHP (%1$s) is lower than the version required by Jetpack (%2$s). Please update PHP to continue enjoying Jetpack.', 'jetpack' ),
				esc_html( phpversion() ),
				JETPACK__MINIMUM_PHP_VERSION
			)
		);
	}
	add_action( 'admin_notices', 'jetpack_admin_unsupported_php_notice' );
	return;
}

/**
 * Load all the packages.
 *
 * We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.
 * If the autoloader is not present, let's log the failure, pause Jetpack, and display a nice admin notice.
 */
$jetpack_autoloader = JETPACK__PLUGIN_DIR . 'vendor/autoload.php';
if ( is_readable( $jetpack_autoloader ) ) {
	require $jetpack_autoloader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			sprintf(
				/* translators: Placeholder is a link to a support document. */
				__( 'Your installation of Jetpack is incomplete. If you installed Jetpack from GitHub, please refer to <a href="%1$s" target="_blank" rel="noopener noreferrer">this document</a> to set up your development environment.', 'jetpack' ),
				esc_url( 'https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md' )
			)
		);
	}
	add_action( 'admin_notices', 'jetpack_admin_missing_autoloader' );
	return;
}


add_filter( 'jetpack_require_lib_dir', 'jetpack_require_lib_dir' );
add_filter( 'jetpack_should_use_minified_assets', 'jetpack_should_use_minified_assets', 9 );

// @todo: Abstract out the admin functions, and only include them if is_admin()
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack.php'               );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-network.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-data.php'          );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-client-server.php' );
require_once( JETPACK__PLUGIN_DIR . 'sync/class.jetpack-sync-actions.php' );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-options.php'       );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-user-agent.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-post-images.php'   );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-error.php'         );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-heartbeat.php'     );
require_once( JETPACK__PLUGIN_DIR . 'class.photon.php'                );
require_once( JETPACK__PLUGIN_DIR . 'functions.photon.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.global.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.compat.php'            );
require_once( JETPACK__PLUGIN_DIR . 'functions.gallery.php'           );
require_once( JETPACK__PLUGIN_DIR . 'require-lib.php'                 );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-autoupdate.php'    );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-tracks.php'        );
require_once( JETPACK__PLUGIN_DIR . 'class.frame-nonce-preview.php'   );
require_once( JETPACK__PLUGIN_DIR . 'modules/module-headings.php');
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-constants.php');
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-idc.php'  );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-connection-banner.php'  );
require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-plan.php'          );

if ( is_admin() ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php'     );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-jitm.php'      );
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-affiliate.php' );
	jetpack_require_lib( 'debugger' );
}

// Play nice with http://wp-cli.org/
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-cli.php'       );
}

require_once( JETPACK__PLUGIN_DIR . '_inc/lib/class.core-rest-api-endpoints.php' );

register_activation_hook( __FILE__, array( 'Jetpack', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack', 'plugin_deactivation' ) );
add_action( 'updating_jetpack_version', array( 'Jetpack', 'do_version_bump' ), 10, 2 );
add_action( 'init', array( 'Jetpack', 'init' ) );
add_action( 'plugins_loaded', array( 'Jetpack', 'plugin_textdomain' ), 99 );
add_action( 'plugins_loaded', array( 'Jetpack', 'load_modules' ), 100 );
add_filter( 'jetpack_static_url', array( 'Jetpack', 'staticize_subdomain' ) );
add_filter( 'is_jetpack_site', '__return_true' );

/**
 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
 *
 * See: http://jetpack.com/2013/07/11/photon-and-themes/
 */
if ( Jetpack::is_module_active( 'photon' ) ) {
	add_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );
}

if ( JETPACK__SANDBOX_DOMAIN ) {
	require_once( JETPACK__PLUGIN_DIR . '_inc/jetpack-server-sandbox.php' );
}

require_once( JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php' );

Jetpack::init();
