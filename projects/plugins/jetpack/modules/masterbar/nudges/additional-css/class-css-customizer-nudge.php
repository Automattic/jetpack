<?php
/**
 * CSS_Customizer_Nudge file.
 * CSS Nudge implementation for Atomic and WPCOM.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\CSS_Customizer_Nudge instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\CSS_Customizer_Nudge as Masterbar_CSS_Customizer_Nudge;

/**
 * Class WPCOM_CSS_Customizer
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class CSS_Customizer_Nudge {
	/**
	 * Instance of \Automattic\Jetpack\Masterbar\CSS_Customizer_Nudge
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\CSS_Customizer_Nudge
	 */
	private $css_customizer_nudge_wrapper;

	/**
	 * CSS_Customizer_Nudge constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $cta_url      The URL to the plans.
	 * @param string $nudge_copy   The nudge text.
	 * @param string $control_name The slug prefix of the nudge.
	 */
	public function __construct( $cta_url, $nudge_copy, $control_name = 'custom_css' ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Customizer_Nudge::__construct' );
		$this->css_customizer_nudge_wrapper = new Masterbar_CSS_Customizer_Nudge( $cta_url, $nudge_copy, $control_name );
	}

	/**
	 * Register the assets required for the CSS nudge page from the Customizer.
	 *
	 * @deprecated 13.7
	 */
	public function customize_controls_enqueue_scripts_nudge() {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Customizer_Nudge::customize_controls_enqueue_scripts_nudge' );
		$this->css_customizer_nudge_wrapper->customize_controls_enqueue_scripts_nudge();
	}

	/**
	 * Register the CSS nudge in the Customizer.
	 *
	 * @deprecated 13.7
	 *
	 * @param \WP_Customize_Manager $wp_customize The customize manager.
	 */
	public function customize_register_nudge( \WP_Customize_Manager $wp_customize ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Customizer_Nudge::customize_register_nudge' );
		$this->css_customizer_nudge_wrapper->customize_register_nudge( $wp_customize );
	}

	/**
	 * Create a nudge control object.
	 *
	 * @deprecated 13.7
	 *
	 * @param \WP_Customize_Manager $wp_customize The Core Customize Manager.
	 *
	 * @return \Automattic\Jetpack\Masterbar\CSS_Nudge_Customize_Control
	 */
	public function create_css_nudge_control( \WP_Customize_Manager $wp_customize ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Customizer_Nudge::create_css_nudge_control' );
		return $this->css_customizer_nudge_wrapper->create_css_nudge_control( $wp_customize );
	}

	/**
	 * Create the nudge section.
	 *
	 * @deprecated 13.7
	 *
	 * @param \WP_Customize_Manager $wp_customize The core Customize Manager.
	 *
	 * @return \WP_Customize_Section
	 */
	public function create_css_nudge_section( \WP_Customize_Manager $wp_customize ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\CSS_Customizer_Nudge::create_css_nudge_section' );
		return $this->css_customizer_nudge_wrapper->create_css_nudge_section( $wp_customize );
	}
}
