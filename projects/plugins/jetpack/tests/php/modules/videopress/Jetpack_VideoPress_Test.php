<?php
/**
 * Jetpack_VideoPress module tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\VideoPress\Options as VideoPress_Options;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.jetpack-videopress.php';
require_once JETPACK__PLUGIN_DIR . 'modules/videopress/class.videopress-scheduler.php';

/**
 * Tests the Jetpack_VideoPress module class, focused on the media-new.php
 * upload integration.
 *
 * To run: jetpack docker phpunit jetpack -- --filter=Jetpack_VideoPress_Test
 *
 * @covers \Jetpack_VideoPress
 */
#[CoversClass( Jetpack_VideoPress::class )]
class Jetpack_VideoPress_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * The module instance under test.
	 *
	 * @var Jetpack_VideoPress
	 */
	private $instance;

	/**
	 * Saved global WP_Scripts instance, restored after each test.
	 *
	 * @var WP_Scripts|null
	 */
	private $saved_wp_scripts;

	/**
	 * Start each test with an empty script queue and fresh plan/option caches.
	 */
	public function set_up() {
		parent::set_up();
		$this->saved_wp_scripts = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']  = new WP_Scripts();

		$this->instance = Jetpack_VideoPress::init();
		$this->reset_plan_and_options_caches();
	}

	/**
	 * Restore globals and drop the state the tests created.
	 */
	public function tear_down() {
		$GLOBALS['wp_scripts'] = $this->saved_wp_scripts;

		remove_filter( 'plupload_init', array( $this->instance, 'videopress_pluploder_config' ) );
		Jetpack_Options::delete_option( 'id' );
		delete_option( 'jetpack_active_plan' );
		$this->reset_plan_and_options_caches();

		parent::tear_down();
	}

	/**
	 * Resets the Current_Plan and VideoPress_Options static caches so each
	 * test sees the options it sets up.
	 */
	private function reset_plan_and_options_caches() {
		VideoPress_Options::delete_options();

		$cache = new ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		$cache->setAccessible( true );
		$cache->setValue( null, null );
	}

	/**
	 * Simulates a connected site, which enables VideoPress on the free tier.
	 */
	private function connect_site() {
		Jetpack_Options::update_option( 'id', 1234 );
		$this->reset_plan_and_options_caches();
	}

	/**
	 * Simulates a site with a paid VideoPress plan.
	 */
	private function add_videopress_purchase() {
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_free',
				'features'     => array(
					'active' => array( 'videopress-1tb-storage' ),
				),
			)
		);
		$this->reset_plan_and_options_caches();
	}

	/**
	 * Creates a VideoPress video attachment.
	 *
	 * @return int The attachment ID.
	 */
	private function create_videopress_attachment() {
		return wp_insert_attachment(
			array(
				'post_title'     => 'A VideoPress video',
				'post_mime_type' => 'video/videopress',
			)
		);
	}

	/**
	 * The module registers the media-new.php enqueue callback on init.
	 */
	public function test_on_init_registers_media_new_enqueue_hook() {
		$this->instance->on_init();

		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( $this->instance, 'enqueue_media_new_scripts' ) ) );
	}

	/**
	 * The media-new.php script is not enqueued on other admin pages.
	 */
	public function test_media_new_script_not_enqueued_on_other_pages() {
		$this->connect_site();

		$this->instance->enqueue_media_new_scripts( 'upload.php' );

		$this->assertFalse( wp_script_is( 'videopress-media-new', 'enqueued' ) );
	}

	/**
	 * The media-new.php script is not enqueued when VideoPress is not enabled.
	 */
	public function test_media_new_script_not_enqueued_without_videopress() {
		$this->instance->enqueue_media_new_scripts( 'media-new.php' );

		$this->assertFalse( wp_script_is( 'videopress-media-new', 'enqueued' ) );
		$this->assertFalse( has_filter( 'plupload_init', array( $this->instance, 'videopress_pluploder_config' ) ) );
	}

	/**
	 * The media-new.php script is enqueued with the upload limit data and the
	 * plupload filter when VideoPress is enabled.
	 */
	public function test_media_new_script_enqueued_with_limits_and_filter() {
		$this->connect_site();

		$this->instance->enqueue_media_new_scripts( 'media-new.php' );

		$this->assertTrue( wp_script_is( 'videopress-media-new', 'enqueued' ) );
		$this->assertNotFalse( has_filter( 'plupload_init', array( $this->instance, 'videopress_pluploder_config' ) ) );

		$data = $GLOBALS['wp_scripts']->get_data( 'videopress-media-new', 'data' );
		$this->assertStringContainsString( 'videoPressMediaNew', $data );
		$this->assertStringContainsString( 'hasVideoPressPurchase', $data );
	}

	/**
	 * A free-plan site with no VideoPress videos has the free upload available.
	 */
	public function test_upload_limits_free_plan_with_unused_upload() {
		$this->connect_site();

		$limits = $this->instance->get_media_new_upload_limits();

		$this->assertFalse( $limits['hasVideoPressPurchase'] );
		$this->assertFalse( $limits['hasUsedVideo'] );
		$this->assertStringContainsString( 'https://wordpress.com/checkout/', $limits['strings']['usedVideoUpload'] );
		$this->assertStringContainsString( 'jetpack_videopress', $limits['strings']['usedVideoUpload'] );
		$this->assertStringContainsString( 'jetpack_videopress', $limits['strings']['multipleVideos'] );
	}

	/**
	 * A free-plan site with a VideoPress video has used the free upload.
	 */
	public function test_upload_limits_free_plan_with_used_upload() {
		$this->connect_site();
		$this->create_videopress_attachment();

		$limits = $this->instance->get_media_new_upload_limits();

		$this->assertFalse( $limits['hasVideoPressPurchase'] );
		$this->assertTrue( $limits['hasUsedVideo'] );
	}

	/**
	 * Local videos that are not on VideoPress do not consume the free upload.
	 */
	public function test_upload_limits_ignores_non_videopress_videos() {
		$this->connect_site();
		wp_insert_attachment(
			array(
				'post_title'     => 'A local video',
				'post_mime_type' => 'video/mp4',
			)
		);

		$limits = $this->instance->get_media_new_upload_limits();

		$this->assertFalse( $limits['hasUsedVideo'] );
	}

	/**
	 * A site with a paid VideoPress plan is not limited.
	 */
	public function test_upload_limits_with_videopress_purchase() {
		$this->connect_site();
		$this->add_videopress_purchase();
		$this->create_videopress_attachment();

		$limits = $this->instance->get_media_new_upload_limits();

		$this->assertTrue( $limits['hasVideoPressPurchase'] );
		$this->assertFalse( $limits['hasUsedVideo'] );
	}
}
