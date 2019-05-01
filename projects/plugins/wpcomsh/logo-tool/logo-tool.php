<?php
/*
 * Plugin Name: Logo Tool
 * Plugin URI: http://wordpress.com
 * Description: Add a "Create Logo" button to the Customizer when the theme supports a logo. The button directs customers to LogoJoy.
 * Author: Automattic
 * Version: 1.2
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

function add_logotool_button( $wp_customize ) {
	if ( ! is_admin() ) {
		return;
	}

	// WP Core logo integration
	if ( current_theme_supports( 'custom-logo' ) ){
		$logo_control = $wp_customize->get_control( 'custom_logo' );

		if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
			return;
		}

	// Jetpack logo integration
	} else if ( current_theme_supports( 'site-logo' ) ){
		$logo_control = $wp_customize->get_control( 'site_logo' );

		if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
			return;
		}
	} else {
		return;
	}

	// using the 'jetpack' namespace because that's what Site Logo uses
	$logo_control->description = __( 'Add a logo once and it will automatically display in every theme that supports logos. No 
logo? Buy a pro one from Looka — Click “Create logo” to start.', 'jetpack' );
	// adding it back just overwrites the previous control instance
	$wp_customize->add_control( $logo_control );

	add_action( 'customize_controls_enqueue_scripts', function() {
		wp_enqueue_script( 'logotool-button', plugins_url( 'js/logotool-button.js', __FILE__ ), [ 'customize-controls' ], 
'20190430', true );
		wp_localize_script( 'logotool-button', '_Logotool_l10n', [
			// using the 'jetpack' namespace because that's what Site Logo uses
			'create' => __( 'Create logo', 'jetpack' ),
		] );
	});

}
add_action( 'customize_register', 'add_logotool_button', 20 );
