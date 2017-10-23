<?php
/**
 * Customize API: Jetpack_CSS_Editor_Customize_Control class
 *
 * @package Jetpack
 * @subpackage Custom CSS
 */

/**
 * Jetpack Customize CSS Editor Control class.
 *
 * @see WP_Customize_Control
 */
class Jetpack_CSS_Editor_Customize_Control extends WP_Customize_Code_Editor_Control {

	/**
	 * Customize control type.
	 *
	 * @var string
	 */
	public $type = 'jetpackCss';

	// @todo Add json() method which includes the exporting of jetpack_css_settings.
}
