<?php
/**
 * Compatibility functions for the Jetpack VideoPress plugin.
 * https://wordpress.org/plugins/jetpack-videopress/
 *
 * @since 11.9
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Jetpack_VideoPress;

use Automattic\Jetpack\Plugins_Installer;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PLUGIN_SLUG = 'jetpack-videopress';
const PLUGIN_FILE = 'jetpack-videopress/jetpack-videopress.php';

add_action( 'admin_notices', __NAMESPACE__ . '\error_notice' );
add_action( 'admin_init', __NAMESPACE__ . '\try_install' );

/**
 * Verify the intent to install Jetpack VideoPress, and kick off installation.
 *
 * This works in tandem with a JITM set up in the JITM package.
 */
function try_install() {
	if ( ! isset( $_GET['jetpack-videopress-action'] ) ) {
		return;
	}

	check_admin_referer( 'jetpack-videopress-install' );

	$result = false;
	// If the plugin install fails, redirect to plugin install page pre-populated with jetpack-videopress search term.
	$redirect_on_error = admin_url( 'plugin-install.php?s=jetpack-videopress&tab=search&type=term' );

	// Attempt to install and activate the plugin.
	if ( current_user_can( 'activate_plugins' ) ) {
		switch ( $_GET['jetpack-videopress-action'] ) {
			case 'install':
				$result = install_and_activate();
				break;
			case 'activate':
				$result = activate();
				break;
		}
	}

	if ( $result ) {
		/** This action is already documented in _inc/lib/class.core-rest-api-endpoints.php */
		do_action( 'jetpack_activated_plugin', PLUGIN_FILE, 'jitm' );
		$redirect = admin_url( 'admin.php?page=jetpack-videopress' );
	} else {
		$redirect = add_query_arg( 'jetpack-videopress-install-error', true, $redirect_on_error );
	}

	wp_safe_redirect( $redirect );

	exit;
}

/**
 * Install and activate the Jetpack VideoPress plugin.
 *
 * @return bool result of installation
 */
function install_and_activate() {
	$result = Plugins_Installer::install_and_activate_plugin( PLUGIN_SLUG );
	return ! is_wp_error( $result );
}

/**
 * Activate the Jetpack VideoPress plugin.
 *
 * @return bool result of activation
 */
function activate() {
	$result = activate_plugin( PLUGIN_FILE );

	// Activate_plugin() returns null on success.
	return $result === null;
}

/**
 * Notify the user that the installation of Jetpack VideoPress failed.
 */
function error_notice() {
	if ( empty( $_GET['jetpack-videopress-install-error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	?>
	<div class="notice notice-error is-dismissible">
		<p><?php esc_html_e( 'There was an error installing Jetpack VideoPress. Please try again.', 'jetpack' ); ?></p>
	</div>
	<?php
}
