<?php
/**
 * VideoPress Player tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-player.php';
require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-video.php';

/**
 * Tests Jetpack VideoPress Player
 *
 * To run: jetpack docker phpunit jetpack -- --filter=VideoPress_Player_Test
 *
 * @covers \VideoPress_Player
 */
#[CoversClass( VideoPress_Player::class )]
class VideoPress_Player_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Saved global WP_Scripts instance, restored after each test.
	 *
	 * @var WP_Scripts|null
	 */
	private $saved_wp_scripts;

	/**
	 * Start each test with an empty script queue so enqueue assertions are isolated.
	 */
	public function set_up() {
		parent::set_up();
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();
	}

	/**
	 * Restore the original global WP_Scripts instance.
	 */
	public function tear_down() {
		$GLOBALS['wp_scripts'] = $this->saved_wp_scripts;
		parent::tear_down();
	}

	/**
	 * Gets the test data for test_output_html5_dynamic_next().
	 *
	 * @return array The test data.
	 */
	public static function get_html_test_data() {
		return array(
			'cover_enabled'  => array(
				array(
					'cover' => true,
				),
				"<iframe title='VideoPress Video Player' aria-label='VideoPress Video Player' width='0' height='0' src='https://videopress.com/embed/testguid?cover=1&amp;hd=0' frameborder='0' allowfullscreen data-resize-to-parent=\"true\" allow='clipboard-write; presentation'></iframe>",
			),
			'cover_disabled' => array(
				array(
					'cover' => false,
				),
				"<iframe title='VideoPress Video Player' aria-label='VideoPress Video Player' width='0' height='0' src='https://videopress.com/embed/testguid?cover=0&amp;hd=0' frameborder='0' allowfullscreen allow='clipboard-write; presentation'></iframe>",
			),
		);
	}

	/**
	 * Tests the output of html5_dynamic_next() and that the iframe API script is enqueued.
	 *
	 * @dataProvider get_html_test_data
	 * @param array  $options The player options.
	 * @param string $expected The expected generated content.
	 */
	#[DataProvider( 'get_html_test_data' )]
	public function test_output_html5_dynamic_next( $options, $expected ) {
		$player = new VideoPress_Player( 'testguid', 0, $options );
		$this->assertEquals( $expected, $player->html5_dynamic_next() );
		$this->assertTrue(
			wp_script_is( 'videopress-iframe', 'enqueued' ),
			'The iframe API script should be enqueued rather than printed inline.'
		);
	}

	/**
	 * The iframe API script should be enqueued only once, no matter how many
	 * VideoPress players are rendered on the same page. See #35926.
	 */
	public function test_iframe_script_enqueued_once_for_multiple_players() {
		( new VideoPress_Player( 'testguid', 0, array( 'cover' => true ) ) )->html5_dynamic_next();
		( new VideoPress_Player( 'otherguid', 0, array( 'cover' => true ) ) )->html5_dynamic_next();

		$enqueued = array_keys( wp_scripts()->queue, 'videopress-iframe', true );
		$this->assertCount( 1, $enqueued, 'videopress-iframe should be enqueued exactly once.' );
	}

	/**
	 * With the iframe embed disabled, the VideoJS player script should be
	 * enqueued only once while each video still attaches its own inline
	 * initialization. See #35926.
	 */
	public function test_non_iframe_path_enqueues_videojs_once_with_per_video_init() {
		$use_iframe = '__return_false';
		add_filter( 'jetpack_videopress_player_use_iframe', $use_iframe );

		( new VideoPress_Player( 'testguid', 0, array( 'cover' => true ) ) )->html5_dynamic_next();
		( new VideoPress_Player( 'otherguid', 0, array( 'cover' => true ) ) )->html5_dynamic_next();

		remove_filter( 'jetpack_videopress_player_use_iframe', $use_iframe );

		$enqueued = array_keys( wp_scripts()->queue, 'videopress-videojs', true );
		$this->assertCount( 1, $enqueued, 'videopress-videojs should be enqueued exactly once.' );

		$styles = array_keys( wp_styles()->queue, 'videopress-videojs', true );
		$this->assertCount( 1, $styles, 'The videopress-videojs stylesheet should be enqueued exactly once.' );

		$inline = wp_scripts()->get_data( 'videopress-videojs', 'after' );
		$inline = is_array( $inline ) ? implode( "\n", $inline ) : (string) $inline;
		$this->assertStringContainsString(
			'videopress("testguid", document.querySelector("#v-testguid")',
			$inline,
			'The first video should get its own inline initialization.'
		);
		$this->assertStringContainsString(
			'videopress("otherguid", document.querySelector("#v-otherguid")',
			$inline,
			'The second video should get its own inline initialization.'
		);
	}
}
