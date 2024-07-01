<?php
/**
 * On the profile page, show a notice informing about profile settings on "Classic" admin-interface sites being "untangled" from `/me` and `/me/account`
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Check whether the current page is the profile page
 */
function is_profile_page() {
	$screen = get_current_screen();

	return 'profile' === $screen->id;
}

/**
 * Show a notice informing about profile settings on "Classic" admin-interface sites being "untangled" from `/me` and `/me/account`
 */
function show_classic_admin_interface_profile_settings_notice() {
	if ( ! is_profile_page() ) {
		return;
	}

	$message = sprintf(
		/* translators: 1: Learn more URL */
		__( 'These settings are applied to sites using the Classic admin interface style. <a href="%1$s">Learn more</a>.', 'jetpack-mu-wpcom' ),
		localized_wpcom_url( 'https://wordpress.com/support/dashboard/#set-the-admin-interface-style' )
	);
	wp_admin_notice(
		$message,
		array(
			'dismissible' => true,
			'type'        => 'info',
		)
	);
}

add_action(
	'load-profile.php',
	function () {
		add_action( 'admin_notices', 'show_classic_admin_interface_profile_settings_notice' );
	}
);
