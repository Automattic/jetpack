<?php
/**
 * WPCOM_Additional_CSS_Manager file
 *
 * Is responsible with registering the Additional CSS section in WPCOM.
 *
 * @deprecated 13.7 Use Automattic\Jetpack\Masterbar\WPCOM_Additional_CSS_Manager instead.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar\WPCOM_Additional_CSS_Manager as Masterbar_WPCOM_Additional_CSS_Manager;

/**
 * Class WPCOM_Disable_Additional_CSS
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class WPCOM_Additional_CSS_Manager {

	/**
	 * Instance of \Automattic\Jetpack\Masterbar\WPCOM_Additional_CSS_Manager
	 * Used for deprecation purposes.
	 *
	 * @var \Automattic\Jetpack\Masterbar\WPCOM_Additional_CSS_Manager
	 */
	private $wpcom_additional_css_wrapper;

	/**
	 * WPCOM_Additional_CSS_Manager constructor.
	 *
	 * @deprecated 13.7
	 *
	 * @param string $domain the Site domain.
	 */
	public function __construct( $domain ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_Additional_CSS_Manager::__construct' );
		$this->wpcom_additional_css_wrapper = new Masterbar_WPCOM_Additional_CSS_Manager( $domain );
	}

	/**
	 * Register the Additional CSS nudge.
	 *
	 * @deprecated 13.7
	 *
	 * @param \WP_Customize_Manager $wp_customize_manager The core customize manager.
	 */
	public function register_nudge( \WP_Customize_Manager $wp_customize_manager ) {
		_deprecated_function( __METHOD__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\WPCOM_Additional_CSS_Manager::register_nudge' );
		$this->wpcom_additional_css_wrapper->register_nudge( $wp_customize_manager );
	}
}
