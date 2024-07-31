<?php
/**
 * Show links back to WordPress.com for them to manage their WordPress.com profile.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Adds a link to the WordPress.com profile settings page.
 */
function wpcom_profile_settings_add_links_to_wpcom() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-profile-settings-link-to-wpcom/wpcom-profile-settings-link-to-wpcom.asset.php';
	wp_enqueue_script(
		'wpcom-profile-settings-link-to-wpcom',
		plugins_url( 'build/wpcom-profile-settings-link-to-wpcom/wpcom-profile-settings-link-to-wpcom.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-profile-settings-link-to-wpcom/wpcom-profile-settings-link-to-wpcom.js' ),
		true
	);
	wp_localize_script(
		'wpcom-profile-settings-link-to-wpcom',
		'wpcomProfileSettingsLinkToWpcom',
		array(
			'emailSettingsLinkText' => __( 'Your WordPress.com email is managed on WordPress.com Account settings.', 'jetpack-mu-wpcom' ),
		)
	);
}
add_action( 'load-profile.php', 'wpcom_profile_settings_add_links_to_wpcom' );

/**
 * Disable the email field on Simple sites.
 */
function wpcom_profile_settings_disable_email() {
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return;
	}
	$host = new Automattic\Jetpack\Status\Host();
	if ( ! $host->is_wpcom_simple() ) {
		return;
	}

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-profile-settings-disable-email/wpcom-profile-settings-disable-email.asset.php';
	wp_enqueue_script(
		'wpcom-profile-settings-disable-email',
		plugins_url( 'build/wpcom-profile-settings-disable-email/wpcom-profile-settings-disable-email.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-profile-settings-disable-email/wpcom-profile-settings-disable-email.js' ),
		true
	);
}
add_action( 'load-profile.php', 'wpcom_profile_settings_disable_email' );
