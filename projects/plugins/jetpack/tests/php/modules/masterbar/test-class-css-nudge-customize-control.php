<?php
/**
 * CSS_Nudge_Customize_Control file.
 * Test CSS_Nudge_Customize_Control.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_once ABSPATH . WPINC . '/class-wp-customize-control.php';
require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';

require_jetpack_file( 'modules/masterbar/nudges/bootstrap.php' );

/**
 * Class Test_CSS_Nudge_Customize_Control
 */
class Test_CSS_Nudge_Customize_Control extends \WP_UnitTestCase {

	/**
	 * Check if the HTML for the nudge section is properly generated.
	 */
	public function test_if_the_html_is_generated_properly() {
		$manager = new \WP_Customize_Manager();

		register_css_nudge_control( $manager );
		$control = new CSS_Nudge_Customize_Control(
			$manager,
			'foo',
			array(
				'cta_url'    => 'https://wordpress.com',
				'nudge_copy' => 'foo',
			)
		);

		$this->assertEquals( 'https://wordpress.com', $control->cta_url );
		$this->assertEquals( 'foo', $control->nudge_copy );
		ob_start();
		$control->render_content();
		$content = ob_get_contents();
		ob_end_flush();
		$expected_output = '<div class="nudge-container">
				<p>
					foo
				</p>
				<div class="button-container">
					<button type="button" class="button-primary navigate-to" data-navigate-to-page="https://wordpress.com">Upgrade Now</button>
				</div>
			</div>';
		$this->assertEquals( $expected_output, $content );
	}
}
