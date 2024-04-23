<?php
/**
 * Additional admin color schemes.
 *
 * The content of this file is mostly copied from projects/plugins/jetpack/modules/masterbar/admin-color-schemes/class-admin-color-schemes.php.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Get the admin color scheme URL based on the environment
 *
 * @param string $color_scheme  The color scheme to get the URL for.
 * @param string $file          The file name (optional, default: colors.css).
 * @return string
 */
function get_admin_color_scheme_url( $color_scheme, $file = 'colors.css' ) {
	// TODO: migrate these color scheme CSS files to jetpack-mu-wpcom as well.
	return plugins_url( '_inc/build/masterbar/admin-color-schemes/colors/' . $color_scheme . '/' . $file, JETPACK__PLUGIN_FILE );
}

/**
 * Registers Calypso admin color schemes.
 */
function register_calypso_admin_color_schemes() {
	wp_admin_css_color(
		'aquatic',
		__( 'Aquatic', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'aquatic' ),
		array( '#135e96', '#007e65', '#043959', '#c5d9ed' ),
		array(
			'base'    => '#c5d9ed',
			'focus'   => '#fff',
			'current' => '#01263a',
		)
	);

	wp_admin_css_color(
		'classic-blue',
		__( 'Classic Blue', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'classic-blue' ),
		array( '#135e96', '#b26200', '#dcdcde', '#646970' ),
		array(
			'base'    => '#646970',
			'focus'   => '#2271b1',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'classic-bright',
		__( 'Classic Bright', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'classic-bright' ),
		array( '#135e96', '#c9256e', '#ffffff', '#e9eff5' ),
		array(
			'base'    => '#646970',
			'focus'   => '#1d2327',
			'current' => '#0a4b78',
		)
	);

	wp_admin_css_color(
		'classic-dark',
		__( 'Classic Dark', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'classic-dark' ),
		array( '#101517', '#c9356e', '#32373c', '#0073aa' ),
		array(
			'base'    => '#a2aab2',
			'focus'   => '#00b9eb',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'contrast',
		__( 'Contrast', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'contrast' ),
		array( '#101517', '#ffffff', '#32373c', '#b4b9be' ),
		array(
			'base'    => '#1d2327',
			'focus'   => '#fff',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'nightfall',
		__( 'Nightfall', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'nightfall' ),
		array( '#00131c', '#043959', '#2271b1', '#9ec2e6' ),
		array(
			'base'    => '#9ec2e6',
			'focus'   => '#fff',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'powder-snow',
		__( 'Powder Snow', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'powder-snow' ),
		array( '#101517', '#2271b1', '#dcdcde', '#646970' ),
		array(
			'base'    => '#646970',
			'focus'   => '#135e96',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'sakura',
		__( 'Sakura', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'sakura' ),
		array( '#005042', '#f2ceda', '#2271b1', '#8c1749' ),
		array(
			'base'    => '#8c1749',
			'focus'   => '#4f092a',
			'current' => '#fff',
		)
	);

	wp_admin_css_color(
		'sunset',
		__( 'Sunset', 'jetpack-mu-wpcom' ),
		get_admin_color_scheme_url( 'sunset' ),
		array( '#691c1c', '#b26200', '#f0c930', '#facfd2' ),
		array(
			'base'    => '#facfd2',
			'focus'   => '#fff',
			'current' => '#4f3500',
		)
	);
}

/**
 * Re-enqueue Core color scheme CSS.
 *
 * Currently, the selected color scheme CSS (with id = "colors") is concatenated (by Jetpack Boost / Page Optimize),
 * and is output before the default color scheme CSS, making it lose in specificity.
 *
 * As a workaround, we re-enqueue the color scheme CSS.
 * In order for this one not to be concatenated again, we use the CSS file from an external URL, our CDN (s0.wp.com).
 */
function reenqueue_core_color_scheme() {
	$core_color_schemes = array( 'blue', 'coffee', 'ectoplasm', 'fresh', 'light', 'midnight', 'modern', 'ocean', 'sunrise' );
	$color_scheme       = get_user_option( 'admin_color' );
	if ( in_array( $color_scheme, $core_color_schemes, true ) ) {
		// phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion
		wp_enqueue_style( 'jetpack-core-color-scheme', "https://s0.wp.com/wp-admin/css/colors/$color_scheme/colors.min.css" );
		wp_enqueue_style(
			'jetpack-core-color-schemes-overrides-sidebar-notice',
			get_admin_color_scheme_url( $color_scheme, 'sidebar-notice.css' ),
			array(),
			Jetpack_Mu_Wpcom::PACKAGE_VERSION
		);
	}
}

if ( function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled() ) {
	add_action( 'admin_init', 'register_calypso_admin_color_schemes' );
	add_action( 'admin_enqueue_scripts', 'reenqueue_core_color_scheme' );
}
