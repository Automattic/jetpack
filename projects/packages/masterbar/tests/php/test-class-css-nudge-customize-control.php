<?php
/**
 * Test CSS_Nudge_Customize_Control.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use PHPUnit\Framework\TestCase;

require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
require_once ABSPATH . WPINC . '/class-wp-customize-control.php';

require_once dirname( __DIR__, 2 ) . '/src/nudges/bootstrap.php';

/**
 * @covers Automattic\Jetpack\Masterbar\CSS_Nudge_Customize_Control
 */
class Test_CSS_Nudge_Customize_Control extends TestCase {

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
		ob_end_clean();
		$expected_output = '<div class="nudge-container">
				<p>
					foo
				</p>
				<div class="button-container">
					<button type="button" class="button-primary navigate-to" data-navigate-to-page="https://wordpress.com">Upgrade now</button>
				</div>
			</div>';
		$this->assertEquals( $expected_output, $content );
	}
}
