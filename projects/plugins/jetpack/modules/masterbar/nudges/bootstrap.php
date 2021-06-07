<?php
/**
 * Bootstrap file for the nudges.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use \Automattic\Jetpack\Status;

/**
 * The WP_Customize_Control core class is loaded only on customize_register.
 *
 * @param \WP_Customize_Manager $customize_manager Core customize manager.
 */
function register_css_nudge_control( \WP_Customize_Manager $customize_manager ) {
	require_once __DIR__ . '/additional-css/class-css-nudge-customize-control.php';
	require_once __DIR__ . '/additional-css/class-wpcom-css-customizer-nudge.php';

	$domain = ( new Status() )->get_site_suffix();

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_once __DIR__ . '/additional-css/class-wpcom-additional-css-manager.php';
		$manager = new WPCOM_Additional_CSS_Manager( $domain );
	} else {
		require_once __DIR__ . '/additional-css/class-wporg-additional-css-manager.php';
		$manager = new WPORG_Additional_CSS_Manager( $domain );
	}

	$manager->register_nudge( $customize_manager );
}

/**
 * Load the bootstrap on init action.
 */
function load_bootstrap_on_init() {
	if ( \apply_filters( 'customize_enable_additional_css_nudge', false ) ) {
		\add_action( 'customize_register', __NAMESPACE__ . '\register_css_nudge_control' );
	}
}

add_action( 'init', __NAMESPACE__ . '\load_bootstrap_on_init' );
