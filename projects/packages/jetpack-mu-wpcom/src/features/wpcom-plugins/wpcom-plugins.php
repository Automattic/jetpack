<?php
/**
 * Adds a tiny WordPress.com Plugins integration to the plugin list.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Displays a banner before the plugin browser that links to the WP.com Plugins Marketplace.
 */
function wpcom_plugins_show_banner() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['tab'] ) && 'favorites' === $_GET['tab'] ) {
		// no banner on the favorites tab, it's a bit overbearing given they presumably want
		// something specific.
		return;
	}

	$site_slug        = wp_parse_url( home_url(), PHP_URL_HOST );
	$wpcom_logo       = plugins_url( 'images/wpcom-logo.svg', __FILE__ );
	$background_image = plugins_url( 'images/banner-background.webp', __FILE__ );

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.asset.php';

	/**
	 * Check to see if a string has been translated. This is for the purposes of changing the banner
	 * copies below, this function and checks can be removed after new copies are translated.
	 *
	 * @param string $string The string to check.
	 * @return bool True if the string has been translated, false otherwise.
	 */
	function should_use_new_translation( $string ) { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
		if ( function_exists( 'wpcom_launchpad_has_translation' ) ) {
			return wpcom_launchpad_has_translation( $string, 'jetpack-mu-wpcom' );
		}
		// If that function no longer exists in this context, we can assume the new strings have
		// been translated by now.
		return true;
	}

	$banner_title = should_use_new_translation( 'Unlock more with premium and free plugins' ) ?
		esc_html__( 'Unlock more with premium and free plugins', 'jetpack-mu-wpcom' ) :
		esc_html__( "Flex your site's features with plugins", 'jetpack-mu-wpcom' );

	$banner_description = should_use_new_translation( "Discover a curated selection of free and premium plugins designed to enhance your site's functionality and features." ) ?
		esc_html__( "Discover a curated selection of free and premium plugins designed to enhance your site's functionality and features.", 'jetpack-mu-wpcom' ) :
		esc_html__( "Access a variety of free and paid plugins that can enhance your site's functionality and features.", 'jetpack-mu-wpcom' );

	$banner_cta = should_use_new_translation( 'Explore marketplace plugins' ) ?
		esc_html__( 'Explore marketplace plugins', 'jetpack-mu-wpcom' ) :
		esc_html__( 'Explore plugins', 'jetpack-mu-wpcom' );

	wp_enqueue_script(
		'wpcom-plugins-banner',
		plugins_url( 'build/wpcom-plugins-banner/wpcom-plugins-banner.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.js' ),
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
	wp_localize_script(
		'wpcom-plugins-banner',
		'wpcomPluginsBanner',
		array(
			'logo'             => esc_url( $wpcom_logo ),
			'title'            => $banner_title,
			'description'      => $banner_description,
			'actionUrl'        => esc_url( "https://wordpress.com/plugins/$site_slug?ref=woa-plugin-banner" ),
			'actionText'       => $banner_cta,
			'bannerBackground' => esc_url( $background_image ),
		)
	);

	$asset_file_style = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.asset.php';
	wp_enqueue_style(
		'wpcom-plugins-banner-style',
		plugins_url( 'build/wpcom-plugins-banner-style/wpcom-plugins-banner-style.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		$asset_file_style['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner-style/wpcom-plugins-banner-style.css' )
	);
}
add_action( 'load-plugin-install.php', 'wpcom_plugins_show_banner' );
