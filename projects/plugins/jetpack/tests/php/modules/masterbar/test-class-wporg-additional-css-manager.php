<?php
/**
 * Test_WPORG_Additional_Css_Manager file.
 * Test WPORG_Additional_CSS_Manager.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-section.php';

require_jetpack_file( 'modules/masterbar/nudges/additional-css/class-wporg-additional-css-manager.php' );
require_jetpack_file( 'modules/masterbar/nudges/additional-css/class-css-nudge-customize-control.php' );
require_jetpack_file( 'modules/masterbar/nudges/additional-css/class-wpcom-css-customizer-nudge.php' );

/**
 * Class Test_WPORG_Additional_Css_Manager
 */
class Test_WPORG_Additional_Css_Manager extends \WP_UnitTestCase {
	/**
	 * A mock Customize manager.
	 *
	 * @var \WP_Customize_Manager
	 */
	private $wp_customize;

	/**
	 * Register a customizer manager.
	 *
	 * @return void
	 */
	public function setUp() {
		parent::setUp();

		$this->wp_customize = new \WP_Customize_Manager();
	}

	/**
	 * Check if the nudge contains the proper url and message copy.
	 */
	public function test_it_generates_proper_url_and_nudge() {
		$manager = new WPORG_Additional_CSS_Manager( 'foo.com' );

		$manager->register_nudge( $this->wp_customize );
		$this->assertEquals(
			'/checkout/foo.com/business',
			$this->wp_customize->controls()['custom_css_control']->cta_url
		);
		$this->assertEquals(
			'Purchase a Business Plan to<br> activate CSS customization',
			$this->wp_customize->controls()['custom_css_control']->nudge_copy
		);

	}
}
