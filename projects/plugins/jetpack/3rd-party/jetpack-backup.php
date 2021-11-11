<?php
/**
 * Compatibility functions for the Jetpack Backup plugin.
 * https://wordpress.org/plugins/jetpack-backup/
 *
 * @since 10.4
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Jetpack_Backup;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PLUGIN_SLUG = 'jetpack-backup';
const PLUGIN_FILE = 'jetpack-backup/jetpack-backup.php';

add_action( 'admin_notices', __NAMESPACE__ . '\error_notice' );
add_action( 'admin_init', __NAMESPACE__ . '\try_install' );
add_action( 'jetpack_activated_plugin', __NAMESPACE__ . '\configure_plugin', 10, 2 );

/**
 * Verify the intent to install Jetpack Backupl, and kick off installation.
 *
 * This works in tandem with a JITM set up in the JITM package.
 */
function try_install() {
	if ( ! isset( $_GET['jetpack-backup-action'] ) ) {
		return;
	}

	check_admin_referer( 'jetpack-backup-install' );

	$result   = false;
	$redirect = admin_url( 'edit.php?post_type=feedback' );

	// Attempt to install and activate the plugin.
	if ( current_user_can( 'activate_plugins' ) ) {
		switch ( $_GET['jetpack-backup-action'] ) {
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
		$redirect = admin_url( 'admin.php?page=jetpack-backup' );
	} else {
		$redirect = add_query_arg( 'jetpack-backup-install-error', true, $redirect );
	}

	wp_safe_redirect( $redirect );

	exit;
}

/**
 * Install and activate the Jetpack Backup plugin.
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
 * Activate the Jetpack Backup plugin.
 *
 * @return bool result of activation
 */
function activate() {
	$result = activate_plugin( PLUGIN_FILE );

	// Activate_plugin() returns null on success.
	return is_null( $result );
}

/**
 * Notify the user that the installation of Jetpack Backup failed.
 */
function error_notice() {
	if ( empty( $_GET['jetpack-backup-install-error'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		return;
	}

	?>
	<div class="notice notice-error is-dismissible">
		<p><?php esc_html_e( 'There was an error installing Jetpack Backup.', 'jetpack' ); ?></p>
	</div>
	<?php
}

/**
 * Set some options when first activating the plugin via Jetpack.
 *
 * @since 8.9.0
 *
 * @param string $plugin_file Plugin file.
 * @param string $source      Where did the plugin installation originate.
 */
function configure_plugin( $plugin_file, $source ) {
	if ( PLUGIN_FILE !== $plugin_file ) {
		return;
	}

	$plugin_info = array(
		'plugin'  => 'jetpack',
		'version' => JETPACK__VERSION,
		'time'    => time(),
		'source'  => esc_attr( $source ),
	);

	update_option( 'jetpack_backup_referred_by', $plugin_info );
}
