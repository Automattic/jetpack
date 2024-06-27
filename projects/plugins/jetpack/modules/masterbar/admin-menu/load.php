<?php
/**
 * Admin Menu loader.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar;

/**
 * Checks whether the navigation customizations should be performed for the given class.
 *
 * @deprecated $$next-version$$
 *
 * @param string $admin_menu_class Class name.
 *
 * @return bool
 */
function should_customize_nav( $admin_menu_class ) {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\should_customize_nav' );
	return Masterbar\should_customize_nav( $admin_menu_class );
}

/**
 * Hides the Customizer menu items when the block theme is active by removing the dotcom-specific actions.
 * They are not needed for block themes.
 *
 * @deprecated $$next-version$$
 *
 * @see https://github.com/Automattic/jetpack/pull/36017
 */
function hide_customizer_menu_on_block_theme() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\hide_customizer_menu_on_block_theme' );
	return Masterbar\hide_customizer_menu_on_block_theme();
}

/**
 * Gets the name of the class that customizes the admin menu.
 *
 * @deprecated $$next-version$$
 *
 * @return string Class name.
 */
function get_admin_menu_class() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\get_admin_menu_class' );
	return Masterbar\get_admin_menu_class();
}

/**
 * Filters the name of the class that customizes the admin menu. It should extends the `Base_Admin_Menu` class.
 *
 * @module masterbar
 *
 * @since 9.6.0
 *
 * @param string $admin_menu_class Class name.
 */
$admin_menu_class = apply_filters( 'jetpack_admin_menu_class', get_admin_menu_class() );
if ( should_customize_nav( $admin_menu_class ) ) {
	/** The admin menu singleton instance. @var Base_Admin_Menu $instance */
	$admin_menu_class::get_instance();

	/**
	 * Trigger an event when the user uses the dashboard quick switcher.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param string $screen The current screen.
	 * @param string $view The view the user choosed to go to.
	 */
	function dashboard_quick_switcher_record_usage( $screen, $view ) {
		_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\dashboard_quick_switcher_record_usage' );
		return Masterbar\dashboard_quick_switcher_record_usage( $screen, $view );
	}

	\add_action( 'jetpack_dashboard_switcher_changed_view', __NAMESPACE__ . '\dashboard_quick_switcher_record_usage', 10, 2 );
} else {
	\add_filter( 'jetpack_load_admin_menu_class', '__return_false' );
}
