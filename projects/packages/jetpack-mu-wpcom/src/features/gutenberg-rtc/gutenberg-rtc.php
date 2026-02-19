<?php
/**
 * Gutenberg RTC (Real-Time Collaboration) customizations
 * This handles RTC-related configurations for the Gutenberg editor on JP sites.
 *
 * Currently disables HTTP polling to prevent issues, but can be extended
 * in the future for other RTC-related customizations.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Returns true if the site has at least 2 users who can edit posts.
 *
 * @return bool
 */
function wpcom_gutenberg_rtc_has_multiple_editors(): bool {
	return count(
		get_users(
			array(
				'number'     => 2,
				'fields'     => 'ID',
				'capability' => 'edit_posts',
			)
		)
	) >= 2;
}

/**
 * Returns true for eligible plan
 *
 * @return bool
 */
function wpcom_gutenberg_rtc_is_wpcom_business_plan(): bool {
	if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
		return false;
	}

	if ( ! class_exists( 'WPCOM_Store_API' ) ) {
		return false;
	}

	$plan = WPCOM_Store_API::get_current_plan();
	return WPCOM_Store::is_wpcom_business_plan( $plan['product_id'] );
}

/**
 * Check if the site is eligible for Gutenberg RTC.
 * Eligible sites are based on user count and plan.
 *
 * @return bool
 */
function is_eligible_for_gutenberg_rtc() {
	if ( ! wpcom_gutenberg_rtc_has_multiple_editors() ) {
		return false;
	}

	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		return true;
	}

	return wpcom_gutenberg_rtc_is_wpcom_business_plan();
}

/**
 * Enqueue block editor assets for Gutenberg RTC customizations.
 */
function wpcom_enqueue_gutenberg_rtc_assets() {
	$asset_file          = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/gutenberg-rtc/gutenberg-rtc.asset.php';
	$script_dependencies = $asset_file['dependencies'] ?? array();
	$version             = $asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/gutenberg-rtc/gutenberg-rtc.js' );

	wp_enqueue_script(
		'gutenberg-rtc-script',
		plugins_url( 'build/gutenberg-rtc/gutenberg-rtc.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$version,
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' );
