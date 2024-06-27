<?php
/**
 * Bootstrap file for the nudges.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar;

/**
 * The WP_Customize_Control core class is loaded only on customize_register.
 *
 * @deprecated $$next-version$$
 *
 * @param \WP_Customize_Manager $customize_manager Core customize manager.
 */
function register_css_nudge_control( \WP_Customize_Manager $customize_manager ) {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\register_css_nudge_control' );
	Masterbar\register_css_nudge_control( $customize_manager );
}

/**
 * Load the bootstrap on init action.
 *
 * We need to load on init because otherwise the filter will not be set to true in WPCOM (since the add_filter is set on init).
 *
 * @deprecated $$next-version$$
 */
function load_bootstrap_on_init() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\load_bootstrap_on_init' );
	Masterbar\load_bootstrap_on_init();
}

add_action( 'init', __NAMESPACE__ . '\load_bootstrap_on_init' );
