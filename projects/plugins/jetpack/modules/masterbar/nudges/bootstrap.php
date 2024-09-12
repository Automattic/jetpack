<?php
/**
 * Bootstrap file for the nudges.
 *
 * @deprecated 13.7
 *
 * @package Jetpack
 *
 * @phan-file-suppress PhanDeprecatedFunction -- Ok for deprecated code to call other deprecated code.
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

_deprecated_file( __FILE__, 'jetpack-13.7' );

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * The WP_Customize_Control core class is loaded only on customize_register.
 *
 * @deprecated 13.7
 *
 * @param \WP_Customize_Manager $customize_manager Core customize manager.
 */
function register_css_nudge_control( \WP_Customize_Manager $customize_manager ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\register_css_nudge_control' );
	require_once __DIR__ . '/additional-css/class-css-nudge-customize-control.php';
	require_once __DIR__ . '/additional-css/class-css-customizer-nudge.php';

	$domain = ( new Status() )->get_site_suffix();

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_once __DIR__ . '/additional-css/class-wpcom-additional-css-manager.php';
		$manager = new WPCOM_Additional_CSS_Manager( $domain );
	} elseif ( ( new Host() )->is_woa_site() ) {
		require_once __DIR__ . '/additional-css/class-atomic-additional-css-manager.php';
		$manager = new Atomic_Additional_CSS_Manager( $domain );
	}

	if ( ! isset( $manager ) ) {
		return;
	}

	$manager->register_nudge( $customize_manager );
}

/**
 * Load the bootstrap on init action.
 *
 * We need to load on init because otherwise the filter will not be set to true in WPCOM (since the add_filter is set on init).
 *
 * @deprecated 13.7
 */
function load_bootstrap_on_init() {
	_deprecated_function( __FUNCTION__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\load_bootstrap_on_init' );
	/**
	 * Disable Additional CSS section from Customizer in WPCOM and Atomic and replace it with a nudge.
	 *
	 * @module masterbar
	 *
	 * @since 9.9.0
	 *
	 * @param bool
	 */
	if ( \apply_filters( 'jetpack_customize_enable_additional_css_nudge', false ) ) {
		\add_action( 'customize_register', __NAMESPACE__ . '\register_css_nudge_control' );
	}
}

add_action( 'init', __NAMESPACE__ . '\load_bootstrap_on_init' );
