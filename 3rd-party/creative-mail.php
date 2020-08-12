<?php
/**
 * Compatibility functions for the Creative Mail plugin.
 * https://wordpress.org/plugins/creative-mail-by-constant-contact/
 *
 * @since 8.9.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Creative_Mail;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PLUGIN_SLUG = 'creative-mail-by-constant-contact';
const PLUGIN_FILE = 'creative-mail-by-constant-contact/creative-mail-plugin.php';

add_action( 'admin_notices', __NAMESPACE__ . '\error_notice' );
add_action( 'admin_init', __NAMESPACE__ . '\try_install' );

/**
 * Verify the intent to install Creative Mail, and kick off installation.
 *
 * This works in tandem with a JITM set up in the JITM package.
 */
function try_install() {
	if ( ! isset( $_GET['creative-mail-action'] ) ) {
		return;
	}

	check_admin_referer( 'creative-mail-install' );

	$result   = false;
	$redirect = admin_url( 'edit.php?post_type=feedback' );

	// Attempt to install and activate the plugin.
	if ( current_user_can( 'activate_plugins' ) ) {
		switch ( $_GET['creative-mail-action'] ) {
			case 'install':
				$result = install_and_activate();
				break;
			case 'activate':
				$result = activate();
				break;
		}
	}

	if ( $result ) {
		$redirect = admin_url( 'admin.php?page=creativemail' );
	} else {
		$redirect = add_query_arg( 'creative-mail-install-error', true, $redirect );
	}

	wp_safe_redirect( $redirect );

	exit;
}

/**
 * Install and activate the Creative Mail plugin.
 *
 * @return bool result of installation
 */
function install_and_activate() {
	jetpack_require_lib( 'plugins' );
	$result = \Jetpack_Plugins::install_and_activate_plugin( PLUGIN_SLUG );

	if ( is_wp_error( $result ) ) {
		return false;
	} else {
		return true;
	}
}

/**
 * Activate the Creative Mail plugin.
 *
 * @return bool result of activation
 */
function activate() {
	$result = activate_plugin( PLUGIN_FILE );

	// Activate_plugin() returns null on success.
	return is_null( $result );
}

/**
 * Notify the user that the installation of Creative Mail failed.
 */
function error_notice() {
	if ( empty( $_GET['creative-mail-install-error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	?>
	<div class="notice notice-error is-dismissible">
		<p><?php esc_html_e( 'There was an error installing Creative Mail.', 'jetpack' ); ?></p>
	</div>
	<?php
}
