<?php
/**
 * Show links back to WordPress.com for them to manage their WordPress.com profile.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Check if the site is a WordPress.com Atomic site.
 *
 * @return bool
 */
function is_woa_site() {
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}
	$host = new Automattic\Jetpack\Status\Host();
	return $host->is_woa_site();
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

	$is_wpcom_atomic_classic = is_woa_site() && get_option( 'wpcom_admin_interface' ) === 'wp-admin';

	wp_localize_script(
		'wpcom-profile-settings-link-to-wpcom',
		'wpcomProfileSettingsLinkToWpcom',
		array(
			'language'             => array(
				'link' => esc_url( 'https://wordpress.com/me/account' ),
				'text' => __( 'Manage your WordPress.com account language ↗', 'jetpack-mu-wpcom' ),
			),
			'name'                 => array(
				'link' => esc_url( 'https://wordpress.com/me' ),
				'text' => __( 'Manage your WordPress.com profile ↗', 'jetpack-mu-wpcom' ),
			),
			'website'              => array(
				'link' => esc_url( 'https://wordpress.com/me' ),
				'text' => __( 'Manage your WordPress.com profile website ↗', 'jetpack-mu-wpcom' ),
			),
			'bio'                  => array(
				'link' => esc_url( 'https://wordpress.com/me' ),
				'text' => __( 'Manage your WordPress.com profile bio ↗', 'jetpack-mu-wpcom' ),
			),
			'email'                => array(
				'link' => esc_url( 'https://wordpress.com/me/account' ),
				'text' => __( 'Manage your WordPress.com account email ↗', 'jetpack-mu-wpcom' ),
			),
			'password'             => array(
				'link' => esc_url( 'https://wordpress.com/me/security' ),
				'text' => __( 'Manage your WordPress.com password ↗', 'jetpack-mu-wpcom' ),
			),
			'isWpcomAtomicClassic' => $is_wpcom_atomic_classic,
		)
	);
}
add_action( 'profile_personal_options', 'wpcom_profile_settings_add_links_to_wpcom' );
