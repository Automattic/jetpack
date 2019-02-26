<?php
/*
 * Plugin Name: Logo Tool
 * Plugin URI: http://wordpress.com
 * Description: Add a logo to your WordPress site. Set it once, and all themes that support it will display it automatically.
 * Author: Automattic
 * Version: 1.0
 * Author URI: http://wordpress.com
 * License: GPL2 or later
 * Text Domain: logo-tools
 * Domain Path: /languages/
 */

/**
 * Activate the Site Logo plugin.
 *
 * @uses current_theme_supports()
 * @since 3.2
 */

function add_logojoy_button( $wp_customize ) {
	if ( ! ( current_theme_supports( 'custom-logo' ) || current_theme_supports( 'site-logo' ) ) || ! is_admin() ) {
		return;
	}
	$logo_control = $wp_customize->get_control( 'custom_logo' );

	// not what we want? ah well, bye.
	if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
		// try Jetpack
		$logo_control = $wp_customize->get_control( 'site_logo' );
		if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
			return;
		}
	}

	// using the 'jetpack' namespace because that's what Site Logo uses
	$logo_control->description = __( 'Add a logo once and it will automatically display in every theme that supports logos. No logo? Logojoy will help you make one — Click “Create logo” to start.', 'jetpack' );
	// adding it back just overwrites the previous control instance
	$wp_customize->add_control( $logo_control );

	add_action( 'customize_controls_enqueue_scripts', function() {
		wp_enqueue_script( 'logojoy-button', plugins_url( 'js/logojoy-button.js', __FILE__ ), [ 'customize-controls' ], '20190225', true );
		wp_localize_script( 'logojoy-button', '_Logojoy_l10n', [
			// using the 'jetpack' namespace because that's what Site Logo uses
			'create' => __( 'Create logo', 'jetpack' ),
		] );
	});
}
add_action( 'customize_register', 'add_logojoy_button', 20 );
