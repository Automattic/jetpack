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
 * IMPORTANT: All changes in this plugin should be synced between wpcom (Simple Sites) and wpcomsh (Atomic Sites).
 *
 * https://wpcom.trac.automattic.com/browser/trunk/wp-content/mu-plugins/logo-tool
 * https://github.com/Automattic/wpcomsh/tree/master/logo-tool
 */

/**
 * Activate the Site Logo plugin.
 *
 * @uses current_theme_supports()
 */
function add_logotool_button( $wp_customize ) {
	if ( ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) || ! is_admin() ) {
		return;
	}

	// WP Core logo integration.
	if ( current_theme_supports( 'custom-logo' ) ) {
		$logo_control = $wp_customize->get_control( 'custom_logo' );
	// Jetpack logo integration.
	} else if ( current_theme_supports( 'site-logo' ) ) {
		$logo_control = $wp_customize->get_control( 'site_logo' );
	} else {
		return;
	}

	if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
		return;
	}

	$logo_control->description = __( 'Add a logo once and it will automatically display in every theme that supports logos. No
logo? Buy a pro one from Looka — Click “Create logo” to start.' );
	// Adding it back just overwrites the previous control instance.
	$wp_customize->add_control( $logo_control );

	add_action( 'customize_controls_enqueue_scripts', function() {
		wp_enqueue_style( 'wpcom-logo-tool', plugins_url( 'css/customizer.css', __FILE__ ), [], '20190928' );
		wp_style_add_data( 'wpcom-logo-tool', 'rtl', 'replace' );

		wp_enqueue_script( 'wpcom-logo-tool', plugins_url( 'js/customizer.js', __FILE__ ), [ 'customize-controls' ],
'20190928', true );
		wp_localize_script( 'wpcom-logo-tool', '_LogoTool_l10n', [
			'create' => __( 'Create logo' ),
		] );
	});

}
add_action( 'customize_register', 'add_logotool_button', 20 );
