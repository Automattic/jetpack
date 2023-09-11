<?php
/**
 * VideoPress Player tests.
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-player.php';
require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-video.php';

/**
 * Tests Jetpack VideoPress Player
 *
 * To run: jetpack docker phpunit -- --filter=videopress_player
 */
class WP_Test_VideoPress_Player extends WP_UnitTestCase {
	/**
	 * Gets the test data for test_output_html5_dynamic_next().
	 *
	 * @return array The test data.
	 */
	public function get_html_test_data() {
		return array(
			'cover_enabled'  => array(
				array(
					'cover' => true,
				),
				// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
				"<iframe title='VideoPress Video Player' aria-label='VideoPress Video Player' width='0' height='0' src='https://videopress.com/embed/testguid?cover=1&amp;hd=0' frameborder='0' allowfullscreen data-resize-to-parent=\"true\" allow='clipboard-write'></iframe><script src='https://s0.wp.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js'></script>",
			),
			'cover_disabled' => array(
				array(
					'cover' => false,
				),
				// phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript
				"<iframe title='VideoPress Video Player' aria-label='VideoPress Video Player' width='0' height='0' src='https://videopress.com/embed/testguid?cover=0&amp;hd=0' frameborder='0' allowfullscreen allow='clipboard-write'></iframe><script src='https://s0.wp.com/wp-content/plugins/video/assets/js/next/videopress-iframe.js'></script>",
			),
		);
	}

	/**
	 * Tests the output of html5_dynamic_next().
	 *
	 * @dataProvider get_html_test_data
	 * @covers VideoPress_Player::test_output_html5_dynamic_next()
	 *
	 * @param array  $options The player options.
	 * @param string $expected The expected generated content.
	 */
	public function test_output_html5_dynamic_next( $options, $expected ) {
		$player = new VideoPress_Player( 'testguid', 0, $options );
		$this->assertEquals( $expected, $player->html5_dynamic_next() );
	}
}
