<?php
/**
 * Test_WPCOM_CSS_Customizer_Nudge file.
 * Test WPCOM_CSS_Customizer_Nudge.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\WPCOM_CSS_Customizer_Nudge;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-section.php';

require_jetpack_file( 'modules/masterbar/nudges/bootstrap.php' );

/**
 * Class Test_WPCOM_CSS_Customizer_Nudge
 */
class Test_WPCOM_CSS_Customizer_Nudge extends WP_UnitTestCase {

	/**
	 * Check if the assets are registered.
	 */
	public function test_it_enqueues_the_assets() {
		$wp_customize = new \WP_Customize_Manager();
		register_css_nudge_control();
		$nudge = new WPCOM_CSS_Customizer_Nudge( 'url', 'message' );

		$nudge->customize_register_nudge( $wp_customize );

		$this->assertEquals(
			10,
			has_action(
				'customize_controls_enqueue_scripts',
				array(
					$nudge,
					'customize_controls_enqueue_scripts_nudge',
				)
			)
		);
	}

	/**
	 * Check if it creates the css nudge control.
	 */
	public function test_if_it_creates_a_css_nudge_control() {
		$wp_customize = new \WP_Customize_Manager();
		register_css_nudge_control();

		$nudge = new WPCOM_CSS_Customizer_Nudge( 'url', 'message' );

		$nudge->customize_register_nudge( $wp_customize );

		$this->assertArrayHasKey( 'css_nudge_control', $wp_customize->controls() );
		$this->assertArrayHasKey( 'css_nudge', $wp_customize->sections() );
	}

	/**
	 * Check if the url and message are passed correctly to the custom control object.
	 */
	public function test_if_the_url_and_message_are_passed_correctly() {
		$wp_customize = new \WP_Customize_Manager();
		register_css_nudge_control();

		$nudge = new WPCOM_CSS_Customizer_Nudge( 'url', 'message' );

		$nudge->customize_register_nudge( $wp_customize );

		$this->assertEquals( 'url', $wp_customize->controls()['css_nudge_control']->cta_url );
		$this->assertEquals( 'message', $wp_customize->controls()['css_nudge_control']->nudge_copy );
	}

}
