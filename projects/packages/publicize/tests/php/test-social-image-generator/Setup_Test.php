<?php
/**
 * Testing the Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\Social_Image_Generator\Setup;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;

/**
 * Testing the Setup class, in particular the cache-warming behaviour.
 */
class Setup_Test extends BaseTestCase {
	/**
	 * Post ID of the testing post.
	 *
	 * @var int $post_id
	 */
	protected $post_id;

	/**
	 * Instance of the Setup class under test.
	 *
	 * @var Setup $setup
	 */
	protected $setup;

	/**
	 * URLs that wp_remote_get would have fetched, captured via pre_http_request.
	 *
	 * @var string[] $http_requests
	 */
	protected $http_requests = array();

	/**
	 * Initialize tests.
	 */
	public function set_up() {
		/*
		 * Anonymous class to disable the constructor so we can register post meta,
		 * and to force SIG availability without depending on Current_Plan state
		 * (its plan lookup is statically cached and can leak between tests).
		 */
		global $publicize;
		$publicize = new class() extends Publicize {
			public function __construct() {
			}

			public function has_social_image_generator_feature() {
				return true;
			}
		};
		$publicize->register_post_meta();

		// Force the block editor check to pass and intercept any outgoing HTTP.
		add_filter( 'use_block_editor_for_post', '__return_true' );
		add_filter( 'pre_http_request', array( $this, 'mock_http_request' ), 10, 3 );

		$this->post_id = wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);
		$this->setup   = new Setup();
	}

	/**
	 * Reset state after each test.
	 */
	public function tear_down() {
		remove_filter( 'use_block_editor_for_post', '__return_true' );
		remove_filter( 'pre_http_request', array( $this, 'mock_http_request' ), 10 );
		wp_clear_scheduled_hook( 'jetpack_social_sig_warm_image', array( $this->post_id ) );

		global $publicize;
		$publicize = null;

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
	}

	/**
	 * Intercept wp_remote_get and record the requested URL instead of hitting the network.
	 *
	 * @param false|array|\WP_Error $preempt A preemptive return value of an HTTP request.
	 * @param array                 $args    HTTP request arguments.
	 * @param string                $url     The request URL.
	 * @return array A canned successful response.
	 */
	public function mock_http_request( $preempt, $args, $url ) {
		$this->http_requests[] = $url;

		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Enable SIG for the test post, optionally with a token.
	 *
	 * @param array $settings Image generator settings to store.
	 */
	private function enable_sig( $settings = array( 'enabled' => true ) ) {
		update_post_meta( $this->post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, array( 'image_generator_settings' => $settings ) );
	}

	/**
	 * Publishing a SIG-enabled post schedules a single warm event for the post.
	 */
	public function test_publish_schedules_warm_event() {
		$this->enable_sig();
		$this->assertFalse( wp_next_scheduled( 'jetpack_social_sig_warm_image', array( $this->post_id ) ) );

		$this->setup->generate_token_on_save( $this->post_id, get_post( $this->post_id ), true );

		$this->assertIsInt( wp_next_scheduled( 'jetpack_social_sig_warm_image', array( $this->post_id ) ) );
	}

	/**
	 * A non-publish status (e.g. draft) does not schedule the warm event.
	 */
	public function test_draft_does_not_schedule_warm_event() {
		$this->enable_sig();
		wp_update_post(
			array(
				'ID'          => $this->post_id,
				'post_status' => 'draft',
			)
		);

		$this->setup->generate_token_on_save( $this->post_id, get_post( $this->post_id ), true );

		$this->assertFalse( wp_next_scheduled( 'jetpack_social_sig_warm_image', array( $this->post_id ) ) );
	}

	/**
	 * A SIG-disabled post does not schedule the warm event.
	 */
	public function test_sig_disabled_does_not_schedule_warm_event() {
		$this->setup->generate_token_on_save( $this->post_id, get_post( $this->post_id ), true );

		$this->assertFalse( wp_next_scheduled( 'jetpack_social_sig_warm_image', array( $this->post_id ) ) );
	}

	/**
	 * Warming fetches the image URL when SIG is enabled and a token exists.
	 */
	public function test_warm_social_image_fetches_url_when_enabled() {
		$this->enable_sig(
			array(
				'enabled' => true,
				'token'   => 'testtoken',
			)
		);

		$this->setup->warm_social_image( $this->post_id );

		$this->assertCount( 1, $this->http_requests );
		$this->assertStringContainsString( 'sigenerate', $this->http_requests[0] );
	}

	/**
	 * Warming makes no request when SIG is disabled for the post.
	 */
	public function test_warm_social_image_no_request_when_disabled() {
		$this->setup->warm_social_image( $this->post_id );

		$this->assertCount( 0, $this->http_requests );
	}

	/**
	 * Warming makes no request when the image URL is empty (no token yet).
	 */
	public function test_warm_social_image_no_request_when_url_empty() {
		$this->enable_sig( array( 'enabled' => true ) );

		$this->setup->warm_social_image( $this->post_id );

		$this->assertCount( 0, $this->http_requests );
	}
}
