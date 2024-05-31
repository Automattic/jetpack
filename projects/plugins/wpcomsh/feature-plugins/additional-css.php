<?php
/**
 * Manages Additional CSS feature for Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Disable the Core custom CSS and the Jetpack custom CSS module.
 */
function wpcomsh_maybe_disable_custom_css() {
	// Do not run if Jetpack is not enabled.
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Do not execute for older versions of Jetpack.
	if ( version_compare( JETPACK__VERSION, '9.9-alpha', '<' ) ) {
		return;
	}

	if ( wpcom_site_has_feature( WPCOM_Features::CUSTOM_DESIGN ) ) {
		return;
	}

	add_action( 'admin_menu', 'wpcomsh_custom_css_admin_menu' );
	add_filter( 'jetpack_get_available_modules', 'wpcomsh_custom_css_remove_available_module' );
	add_filter( 'jetpack_active_modules', 'wpcomsh_custom_css_remove_active_module' );
	add_filter( 'jetpack_customize_enable_additional_css_nudge', '__return_true' );
}
add_action( 'jetpack_loaded', 'wpcomsh_maybe_disable_custom_css' );

/**
 * Handle our admin menu item and legacy page declaration.
 */
function wpcomsh_custom_css_admin_menu() {
	if ( function_exists( 'wp_is_block_theme' ) && wp_is_block_theme() ) {
		$styles = wp_get_custom_css();
		if ( ! $styles ) {
			return;
		}
	}

	// Add in our legacy page to support old bookmarks and such.
	add_submenu_page( '', __( 'CSS', 'wpcomsh' ), __( 'Additional CSS', 'wpcomsh' ), 'edit_theme_options', 'editcss', '__return_false' );

	// Add in our new page slug that will redirect to the Customizer.
	$hook = add_theme_page( __( 'CSS', 'wpcomsh' ), __( 'Additional CSS', 'wpcomsh' ), 'edit_theme_options', 'editcss-customizer-redirect', '__return_false' );
	add_action( 'load-' . $hook, 'wpcomsh_custom_css_customizer_redirect' );
}

/**
 * Handle the redirect for the customizer.
 *
 * This is necessary because we can't directly add customizer links to the admin menu. There is a core patch in trac
 * that would make this unnecessary.
 *
 * @link https://core.trac.wordpress.org/ticket/39050
 * @return never
 */
function wpcomsh_custom_css_customizer_redirect() {
	$redirect_to = add_query_arg(
		array(
			array(
				'autofocus' => array( 'section' => 'custom_css' ),
			),
		),
		admin_url( 'customize.php' )
	);

	wp_safe_redirect( $redirect_to );
	exit;
}

/**
 * Remove the custom-css module from the active modules in order to disable it entirely.
 *
 * @param array $modules A list of active modules.
 *
 * @return array
 */
function wpcomsh_custom_css_remove_available_module( $modules ) {
	unset( $modules['custom-css'] );

	return $modules;
}

/**
 * Remove Jetpack's custom-css module from active modules.
 *
 * @param array $active_modules The current Jetpack active modules.
 *
 * @return array
 */
function wpcomsh_custom_css_remove_active_module( $active_modules ) {
	return array_filter(
		$active_modules,
		static function ( $module ) {
			return 'custom-css' !== $module;
		}
	);
}
