<?php
/**
 * Test_WPCOM_Additional_Css_Manager file.
 * Test WPCOM_Additional_CSS_Manager.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-section.php';

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/nudges/additional-css/class-wpcom-additional-css-manager.php';
require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/nudges/additional-css/class-css-nudge-customize-control.php';
require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/nudges/additional-css/class-css-customizer-nudge.php';

/**
 * Class Test_WPCOM_Additional_Css_Manager
 */
class Test_WPCOM_Additional_Css_Manager extends \WP_UnitTestCase {

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
	public function set_up() {
		parent::set_up();

		$this->wp_customize = new \WP_Customize_Manager();
	}

	/**
	 * Check if the manager constructs the proper url and copy message.
	 */
	public function test_it_generates_proper_url_and_nudge() {
		$manager = new WPCOM_Additional_CSS_Manager( 'foo.com' );

		$manager->register_nudge( $this->wp_customize );

		$cta_urls = array(
			'/checkout/foo.com/pro',
			'/checkout/foo.com/premium',
		);

		$cta_url = $this->wp_customize->controls()['jetpack_custom_css_control']->cta_url;

		$this->assertContains( $cta_url, $cta_urls );

		$cta_copys = array(
			'Purchase a Pro Plan to<br> activate CSS customization',
			'Purchase a Premium Plan to<br> activate CSS customization',
		);

		$cta_copy = $this->wp_customize->controls()['jetpack_custom_css_control']->nudge_copy;

		$this->assertContains( $cta_copy, $cta_copys );
	}
}
