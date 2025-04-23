<?php
/**
 * Test_Atomic_Additional_CSS_Manager class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-section.php';

/**
 * @covers Automattic\Jetpack\Masterbar\Atomic_Additional_CSS_Manager
 */
#[CoversClass( Atomic_Additional_CSS_Manager::class )]
class Atomic_Additional_CSS_Manager_Test extends TestCase {
	/**
	 * A mock Customize manager.
	 *
	 * @var \WP_Customize_Manager
	 */
	private $wp_customize;

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->wp_customize = new \WP_Customize_Manager();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Check if the nudge contains the proper url and message copy.
	 */
	public function test_it_generates_proper_url_and_nudge() {
		$manager = $this->getMockBuilder( Atomic_Additional_CSS_Manager::class )
			->setConstructorArgs( array( 'foo.com' ) )
			->onlyMethods( array( 'get_plan_name' ) )
			->getMock();

		$manager->method( 'get_plan_name' )->willReturn( 'Business' );

		$manager->register_nudge( $this->wp_customize );

		$this->assertEquals(
			'/checkout/foo.com/business',
			$this->wp_customize->controls()['custom_css_control']->cta_url
		);

		$this->assertEquals(
			'Purchase the Business plan to<br> activate CSS customization',
			$this->wp_customize->controls()['custom_css_control']->nudge_copy
		);
	}
}
