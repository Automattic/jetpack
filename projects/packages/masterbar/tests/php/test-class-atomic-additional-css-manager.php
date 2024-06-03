<?php
/**
 * Test_WPORG_Additional_Css_Manager class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-section.php';

/**
 * @covers Test_WPORG_Additional_Css_Manager
 */
class Test_Atomic_Additional_CSS_Manager extends TestCase {
	/**
	 * A mock Customize manager.
	 *
	 * @var \WP_Customize_Manager
	 */
	private $wp_customize;

	/**
	 * Set up each test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->wp_customize = new \WP_Customize_Manager();
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Check if the nudge contains the proper url and message copy.
	 */
	public function test_it_generates_proper_url_and_nudge() {
		$manager = new Atomic_Additional_CSS_Manager( 'foo.com' );

		$manager->register_nudge( $this->wp_customize );

		$this->assertEquals(
			'/checkout/foo.com/business',
			$this->wp_customize->controls()['custom_css_control']->cta_url
		);

		$this->assertEquals(
			'Purchase the Creator plan to<br> activate CSS customization',
			$this->wp_customize->controls()['custom_css_control']->nudge_copy
		);
	}
}
