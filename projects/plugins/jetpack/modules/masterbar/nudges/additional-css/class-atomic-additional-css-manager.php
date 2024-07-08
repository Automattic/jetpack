<?php
/**
 * WPORG_Additional_CSS_Manager file
 *
 * Responsible with replacing the Core Additional CSS section with an upgrade nudge on Atomic.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\Atomic_Additional_CSS_Manager instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\Atomic_Additional_CSS_Manager as Masterbar_Atomic_Additional_CSS_Manager;

/**
 * Class Atomic_Additional_CSS_Manager
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class Atomic_Additional_CSS_Manager {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\Atomic_Additional_CSS_Manager
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\Atomic_Additional_CSS_Manager
	 */
	private $additional_css_wrapper;

	/**
	 * Atomic_Additional_CSS_Manager constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $domain the Site domain.
	 */
	public function __construct( $domain ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Additional_CSS_Manager::__construct' );
		$this->additional_css_wrapper = new Masterbar_Atomic_Additional_CSS_Manager( $domain );
	}

	/**
	 * Replace the Additional CSS section from Customiz¡er with an upgrade nudge.
	 *
	 * @deprecated 13.7
	 *
	 * @param \WP_Customize_Manager $wp_customize_manager Core customize manager.
	 */
	public function register_nudge( \WP_Customize_Manager $wp_customize_manager ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\Atomic_Additional_CSS_Manager::register_nudge' );
		$this->additional_css_wrapper->register_nudge( $wp_customize_manager );
	}
}
