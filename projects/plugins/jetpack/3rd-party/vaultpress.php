<?php
/**
 * Handles VaultPress->Rewind transition by deactivating VaultPress when needed.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Notify user that VaultPress has been disabled. Hide VaultPress notice that requested attention.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_enabled_notice() {
	// The deactivation is performed here because there may be pages that admin_init runs on,
	// such as admin_ajax, that could deactivate the plugin without showing this notification.
	deactivate_plugins( 'vaultpress/vaultpress.php' );

	// Remove WP core notice that says that the plugin was activated.
	unset( $_GET['activate'] ); // phpcs:ignore WordPress.Security.NonceVerification
	$message = sprintf(
		wp_kses(
			/* Translators: first variable is the full URL to the new dashboard */
			__( '<p style="margin-bottom: 0.25em;"><strong>Jetpack is now handling your backups.</strong></p><p>VaultPress is no longer needed and has been deactivated. You can access your backups at <a href="%3$s" target="_blank" rel="noopener noreferrer">this dashboard</a>.</p>', 'jetpack' ),
			array(
				'a'      => array(
					'href'   => array(),
					'target' => array(),
					'rel'    => array(),
				),
				'p'      => array(
					'style' => array(),
				),
				'strong' => array(),
			)
		),
		esc_url( Redirect::get_url( 'calypso-backups' ) )
	);
	wp_admin_notice(
		$message,
		array(
			'type'               => 'success',
			'dismissible'        => true,
			'additional_classes' => array( 'vp-deactivated' ),
			'paragraph_wrap'     => false,
		)
	);
	?>
	<style>#vp-notice{display:none;}</style>
	<?php
}

/**
 * If Backup & Scan is enabled, remove its entry in sidebar, deactivate VaultPress, and show a notification.
 *
 * @since 5.8
 */
function jetpack_vaultpress_rewind_check() {
	if (
		Jetpack::is_connection_ready() &&
		Jetpack::is_plugin_active( 'vaultpress/vaultpress.php' ) &&
		Jetpack::is_rewind_enabled()
	) {
		remove_submenu_page( 'jetpack', 'vaultpress' );

		add_action( 'admin_notices', 'jetpack_vaultpress_rewind_enabled_notice' );
	}
}

add_action( 'admin_init', 'jetpack_vaultpress_rewind_check', 11 );
