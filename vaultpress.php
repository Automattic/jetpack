<?php
/**
 * Plugin Name: VaultPress
 * Plugin URI: http://vaultpress.com/?utm_source=plugin-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0
 * Description: Protect your content, themes, plugins, and settings with <strong>realtime backup</strong> and <strong>automated security scanning</strong> from <a href="http://vaultpress.com/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">VaultPress</a>. Activate, enter your registration key, and never worry again. <a href="http://vaultpress.com/help/?utm_source=wp-admin&amp;utm_medium=plugin-description&amp;utm_campaign=1.0" rel="nofollow">Need some help?</a>
 * Version: 2.0-beta
 * Author: Automattic
 * Author URI: http://vaultpress.com/?utm_source=author-uri&amp;utm_medium=plugin-description&amp;utm_campaign=1.0
 * License: GPL2+
 * Text Domain: vaultpress
 * Domain Path: /languages/
 *
 * @package VaultPress
 */

// don't call the file directly.
defined( 'ABSPATH' ) || die();

define( 'VAULTPRESS__MINIMUM_PHP_VERSION', '5.3.2' );
define( 'VAULTPRESS__VERSION', '2.0-beta' );
define( 'VAULTPRESS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

/**
 * First, we check for our supported version of PHP. If it fails,
 * we "pause" VaultPress by ending the loading process and displaying an admin_notice to inform the site owner.
 */
if ( version_compare( phpversion(), VAULTPRESS__MINIMUM_PHP_VERSION, '<' ) ) {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			sprintf(
				/* translators: Placeholders are numbers, versions of PHP in use on the site, and required by VaultPress. */
				esc_html__( 'Your version of PHP (%1$s) is lower than the version required by VaultPress (%2$s). Please update PHP to continue enjoying VaultPress.', 'vaultpress' ),
				esc_html( phpversion() ),
				VAULTPRESS__MINIMUM_PHP_VERSION
			)
		);
	}

	/**
	 * Outputs an admin notice for folks running an outdated version of PHP.
	 *
	 * @todo: Remove once WP 5.2 is the minimum version.
	 *
	 * @since 2.0.0
	 */
	function vaultpress_admin_unsupported_php_notice() {
		$update_php_url = ( function_exists( 'wp_get_update_php_url' ) ? wp_get_update_php_url() : 'https://wordpress.org/support/update-php/' );

		?>
		<div class="notice notice-error is-dismissible">
			<p>
			<?php
				printf(
					/* translators: Placeholders are numbers, versions of PHP in use on the site, and required by VaultPress. */
					esc_html__( 'Your version of PHP (%1$s) is lower than the version required by VaultPress (%2$s). Please update PHP to continue enjoying VaultPress.', 'vaultpress' ),
					esc_html( phpversion() ),
					esc_html( VAULTPRESS__MINIMUM_PHP_VERSION )
				);
			?>
			</p>
			<p class="button-container">
				<?php
				printf(
					'<a class="button button-primary" href="%1$s" target="_blank" rel="noopener noreferrer">%2$s <span class="screen-reader-text">%3$s</span><span aria-hidden="true" class="dashicons dashicons-external"></span></a>',
					esc_url( $update_php_url ),
					__( 'Learn more about updating PHP' ),
					/* translators: accessibility text */
					__( '(opens in a new tab)' )
				);
				?>
			</p>
		</div>
		<?php
	}

	add_action( 'admin_notices', 'vaultpress_admin_unsupported_php_notice' );
	return;
}

/**
 * Load all the packages.
 *
 * We want to fail gracefully if `composer install` has not been executed yet, so we are checking for the autoloader.
 * If the autoloader is not present, let's log the failure, pause VaultPress, and display a nice admin notice.
 */
$loader = VAULTPRESS__PLUGIN_DIR . 'vendor/autoload_packages.php';

if ( is_readable( $loader ) ) {
	require $loader;
} else {
	if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
		error_log(
			wp_kses(
				__( 'Your installation of VaultPress is incomplete. If you installed it from GitHub, please run <code>composer install</code>.', 'vaultpress' ),
				array( 'code' => true )
			)
		);
	}
	/**
	 * Outputs an admin notice for folks running VaultPress without having run `composer install`.
	 */
	function vaultpress_admin_missing_autoloader() {
		?>
		<div class="notice notice-error is-dismissible">
			<p>
				<?php
					echo wp_kses(
						__( 'Your installation of VaultPress is incomplete. If you installed it from GitHub, please run <code>composer install</code>.', 'vaultpress' ),
						array( 'code' => true )
					);
				?>
			</p>
		</div>
		<?php
	}
	add_action( 'admin_notices', 'vaultpress_admin_missing_autoloader' );
	return;
}

require_once VAULTPRESS__PLUGIN_DIR . 'class-vaultpress.php';
$vaultpress = VaultPress::init();

if ( isset( $_GET['vaultpress'] ) && $_GET['vaultpress'] ) {
	if ( !function_exists( 'wp_magic_quotes' ) ) {
		// If already slashed, strip.
		if ( get_magic_quotes_gpc() ) {
			$_GET    = stripslashes_deep( $_GET    );
			$_POST   = stripslashes_deep( $_POST   );
			$_COOKIE = stripslashes_deep( $_COOKIE );
		}

		// Escape with wpdb.
		$_GET    = add_magic_quotes( $_GET    );
		$_POST   = add_magic_quotes( $_POST   );
		$_COOKIE = add_magic_quotes( $_COOKIE );
		$_SERVER = add_magic_quotes( $_SERVER );

		// Force REQUEST to be GET + POST.  If SERVER, COOKIE, or ENV are needed, use those superglobals directly.
		$_REQUEST = array_merge( $_GET, $_POST );
	} else {
		wp_magic_quotes();
	}

	if ( !function_exists( 'wp_get_current_user' ) )
		include ABSPATH . '/wp-includes/pluggable.php';

	// TODO: this prevents some error notices but do we need it? is there a better way to check capabilities/logged in user/etc?
	if ( function_exists( 'wp_cookie_constants' ) && !defined( 'AUTH_COOKIE' ) )
		wp_cookie_constants();

	$vaultpress->parse_request( null );

	die();
}

// only load hotfixes if it's not a VP request
require_once( dirname( __FILE__ ) . '/class.vaultpress-hotfixes.php' );
$hotfixes = new VaultPress_Hotfixes();

// Add a helper method to WP CLI for auto-registerion via Jetpack
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once( dirname( __FILE__ ) . '/class.vaultpress-cli.php' );
}

include_once( dirname( __FILE__ ) . '/cron-tasks.php' );
