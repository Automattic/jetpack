<?php
/**
 * Components unit tests.
 * To run: jetpack docker phpunit jetpack -- --filter=Jetpack_Components_Test
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/components.php';

/**
 * Class for testing Jetpack Components functions.
 *
 * @covers Jetpack_Components
 */
#[CoversClass( Jetpack_Components::class )]
class Jetpack_Components_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that the upgrade URL in render_upgrade_nudge is properly encoded
	 *
	 * @since 14.7
	 */
	public function test_render_upgrade_nudge_url_encoding() {
		$edit_url = 'https://example.com/wp-admin/post.php?post=1&action=edit';

		$handles = array();

		// Mock Jetpack_Plans::get_plan to return a valid plan object
		$handles['get_plan'] = \Patchwork\redefine(
			'Jetpack_Plans::get_plan',
			\Patchwork\always(
				array(
					'path_slug' => 'jetpack_complete',
				)
			)
		);

		// Mock the get_edit_post_link function to return the test URL
		$handles['get_edit_post_link'] = \Patchwork\redefine(
			'get_edit_post_link',
			\Patchwork\always( $edit_url )
		);

		// Mock the get_component_markup method, as the file is not available in the test environment
		$handles['get_component_markup'] = \Patchwork\redefine(
			'Jetpack_Components::get_component_markup',
			\Patchwork\always( '<a href="#checkoutUrl#" target="_top" class="components-button is-primary">#buttonText#</a>' )
		);

		// Call render_upgrade_nudge
		$output = Jetpack_Components::render_upgrade_nudge(
			array(
				'plan' => 'jetpack_complete',
			)
		);

		// Verify the output contains properly encoded URL
		$this->assertStringContainsString(
			'checkout/example.org/jetpack_complete?redirect_to=',
			$output,
			'Output should contain the basic checkout URL structure'
		);

		// Verify that the redirect_to parameter is properly encoded
		$this->assertStringContainsString(
			'redirect_to=https%3A%2F%2Fexample.com%2Fwp-admin%2Fpost.php%3Fpost%3D1%26action%3Dedit%26plan_upgraded%3D1',
			$output,
			'The redirect_to parameter should be properly encoded'
		);

		foreach ( $handles as $handle ) {
			if ( null !== $handle ) {
				\Patchwork\restore( $handle );
			}
		}
	}
}
