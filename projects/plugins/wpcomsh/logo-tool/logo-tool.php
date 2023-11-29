<?php
/**
 * Plugin Name: Logo Tool
 * Plugin URI: http://wordpress.com
 * Description: Add a "Create Logo" button to the Customizer when the theme supports a logo. The button directs customers to LogoJoy.
 * Author: Automattic
 * Version: 1.4
 * Author URI: http://wordpress.com
 * License: GPL2 or later
 *
 * @package logo-tool
 */

/**
 * IMPORTANT: All changes in this plugin should be synced between wpcom (Simple Sites) and wpcomsh (Atomic Sites).
 *
 * @see https://wpcom.trac.automattic.com/browser/trunk/wp-content/mu-plugins/logo-tool
 * @see https://github.com/Automattic/wpcomsh/tree/trunk/logo-tool
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
	} elseif ( current_theme_supports( 'site-logo' ) ) {
		// Jetpack logo integration.
		$logo_control = $wp_customize->get_control( 'site_logo' );
	} else {
		// Other custom logo integrations, for example in the dotorg versions of Lovecraft or Radcliffe themes.
		foreach ( $wp_customize->controls() as $control ) {
			if (
				// Control has the name logo in it.
				false !== strpos( $control->id, 'logo' ) &&
				// Control is not a `site_logo` or `custom_logo` (those are handled above).
				! in_array( $control->id, array( 'custom_logo', 'site_logo' ), true ) &&
				// Control is an instance of `WP_Customize_Image_Control` so we know how the UI is rendered to add the button.
				is_a( $control, 'WP_Customize_Image_Control' )
			) {
				$logo_control = $control;
				break;
			}
		}
	}

	// Make sure we have a valid Customize Control.
	if ( ! is_a( $logo_control, 'WP_Customize_Control' ) ) {
		return;
	}

	// And we have a valid setting attached to the control.
	if ( ! is_a( $logo_control->setting, 'WP_Customize_Setting' ) ) {
		return;
	}

	$logo_control->description = __( 'Add a logo to display on your site. No logo? Buy a pro one today — Click “Create logo” to start.', 'wpcomsh' );
	// Adding it back just overwrites the previous control instance.
	$wp_customize->add_control( $logo_control );

	add_action(
		'customize_controls_enqueue_scripts',
		function () use ( $logo_control ) {
			wp_enqueue_script( 'wpcom-logo-tool', plugins_url( 'js/customizer.js', __FILE__ ), array( 'customize-controls' ), '20210706', true );
			wp_localize_script(
				'wpcom-logo-tool',
				'_LogoTool_',
				array(
					'l10n'      => array( 'create' => __( 'Create logo', 'wpcomsh' ) ),
					'controlId' => $logo_control->id,
					'settingId' => $logo_control->setting->id,
				)
			);
		}
	);
}
add_action( 'customize_register', 'add_logotool_button', 20 );
