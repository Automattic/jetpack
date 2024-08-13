<?php
/**
 * Show links back to WordPress.com for them to manage their WordPress.com profile.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Check if the site is a WordPress.com Simple site.
 *
 * @return bool
 */
function is_wpcom_simple() {
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}
	$host = new Automattic\Jetpack\Status\Host();
	return $host->is_wpcom_simple();
}

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

	$is_wpcom_simple = is_wpcom_simple();

	wp_localize_script(
		'wpcom-profile-settings-link-to-wpcom',
		'wpcomProfileSettingsLinkToWpcom',
		array(
			'synced'        => array(
				'link' => esc_url( 'https://wordpress.com/me' ),
				'text' => __( 'You can change your First / Last / Display Names, Website, and Biographical Info on WordPress.com Profile settings', 'jetpack-mu-wpcom' ),
			),
			'email'         => array(
				'link' => esc_url( 'https://wordpress.com/me/account' ),
				'text' => __( 'Your WordPress.com email is managed on WordPress.com Account settings', 'jetpack-mu-wpcom' ),
			),
			'password'      => array(
				'link' => esc_url( 'https://wordpress.com/me/security' ),
				'text' => __( 'Your WordPress.com password is managed on WordPress.com Security settings', 'jetpack-mu-wpcom' ),
			),
			'isWpcomSimple' => $is_wpcom_simple,
		)
	);
}
add_action( 'profile_personal_options', 'wpcom_profile_settings_add_links_to_wpcom' );
