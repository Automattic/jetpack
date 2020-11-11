<?php
/*
 * Plugin Name: Logo Tool
 * Plugin URI: http://wordpress.com
 * Description: Add a "Create Logo" button to the Customizer when the theme supports a logo. The button directs customers to LogoJoy.
 * Author: Automattic
 * Version: 1.4
 * Author URI: http://wordpress.com
 * License: GPL2 or later
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
 *
 * @param WP_Customize_Manager $wp_customize Control manager for the Customizer.
 */
function add_logotool_button( $wp_customize ) {
	if ( ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) || ! is_admin() ) {
		return;
	}

	$logo_control = null;

	if ( current_theme_supports( 'custom-logo' ) ) {
		// WP Core logo integration.
		$logo_control = $wp_customize->get_control( 'custom_logo' );
	} else if ( current_theme_supports( 'site-logo' ) ) {
		// Jetpack logo integration.
		$logo_control = $wp_customize->get_control( 'site_logo' );
	} else {
		// Other custom logo integrations, for example in the dotorg versions of Lovecraft or Radcliffe themes.
		foreach ( $wp_customize->controls() as $control ) {
			if (
				// Control has the name logo in it.
				strpos( $control->id, 'logo' ) &&
				// Control is not a `site_logo` or `custom_logo` (those are handled above).
				! in_array( $control->id, [ 'custom_logo', 'site_logo' ], true ) &&
				// Control is an instance of `WP_Customize_Image_Control` so we know how the UI is rendered to add the button.
				is_a( $control, 'WP_Customize_Image_Control' )
			) {
				$logo_control = $control;
				break;
			}
		}
	}

	if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
		return;
	}

	$logo_control->description = __( 'Add a logo to display on your site. No logo? Buy a pro one from Fiverr — Click “Create logo” to start.', 'wpcomsh' );
	// Adding it back just overwrites the previous control instance.
	$wp_customize->add_control( $logo_control );

	add_action( 'customize_controls_enqueue_scripts', function() use ( $logo_control ) {
		wp_enqueue_style( 'wpcom-logo-tool', plugins_url( 'css/customizer.css', __FILE__ ), [], '20191003' );
		wp_style_add_data( 'wpcom-logo-tool', 'rtl', 'replace' );

		wp_enqueue_script( 'wpcom-logo-tool', plugins_url( 'js/customizer.js', __FILE__ ), [ 'customize-controls' ], '20191003', true );
		wp_localize_script( 'wpcom-logo-tool', '_LogoTool_', [
			'l10n' => [ 'create' => __( 'Create logo', 'wpcomsh' ) ],
			'controlId' => $logo_control->id,
		] );
	} );

}
add_action( 'customize_register', 'add_logotool_button', 20 );
