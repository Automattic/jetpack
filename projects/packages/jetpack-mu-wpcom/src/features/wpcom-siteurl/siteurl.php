<?php
/**
 * Display the site URL in General Settings on Simple Classic sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueues the site URL script and localizes script data for General Settings.
 */
function _wpcom_add_siteurl_to_general_settings() {
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return;
	}

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-siteurl/wpcom-siteurl.asset.php';
	wp_enqueue_script(
		'wpcom-siteurl',
		plugins_url( 'build/wpcom-siteurl/wpcom-siteurl.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-siteurl/wpcom-siteurl.js' ),
		true
	);

	$site_slug           = wpcom_get_site_slug();
	$options_general_url = admin_url( 'options-general.php' );
	wp_add_inline_script(
		'wpcom-siteurl',
		'window.wpcomSiteUrl = ' . wp_json_encode(
			array(
				'siteUrl'           => get_option( 'siteurl' ),
				'homeUrl'           => get_option( 'home' ),
				'siteSlug'          => $site_slug,
				'optionsGeneralUrl' => $options_general_url,
			)
		) . ';',
		'before'
	);
}
add_action( 'load-options-general.php', '_wpcom_add_siteurl_to_general_settings' );
