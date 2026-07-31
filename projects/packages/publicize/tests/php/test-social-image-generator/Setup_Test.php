<?php
/**
 * Testing the Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Publicize\Social_Image_Generator\Setup;
use Jetpack_Options;
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
			// The token endpoint responds with a bare JSON string; other callers ignore the body.
			'body'     => '"generated-token"',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Fake a site-level connection so token generation reaches the proxied request,
	 * which the HTTP mock above then answers.
	 */
	private function connect_blog() {
		( new Tokens() )->update_blog_token( 'new.blogtoken' );
		Jetpack_Options::update_option( 'id', get_current_blog_id() );
	}

	/**
	 * Save the post the way WordPress does after the editor writes its meta.
	 */
	private function save_post() {
		$this->setup->generate_token_on_save( $this->post_id, get_post( $this->post_id ), true );
	}

	/**
	 * Store the post's social options wholesale.
	 *
	 * @param array $options Options to store.
	 */
	private function set_social_options( $options ) {
		update_post_meta( $this->post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, $options );
	}

	/**
	 * Read back the post's stored attached media.
	 *
	 * @return array
	 */
	private function get_attached_media() {
		$options = get_post_meta( $this->post_id, Publicize::POST_JETPACK_SOCIAL_OPTIONS, true );

		return $options['attached_media'] ?? array();
	}

	/**
	 * Build the social options for a post sharing the generated image as an attachment.
	 *
	 * @param string $media_source   Which media the post shares.
	 * @param array  $attached_media Attachment entries to store.
	 * @return array
	 */
	private function sig_options( $media_source, $attached_media ) {
		return array(
			'media_source'             => $media_source,
			'attached_media'           => $attached_media,
			'image_generator_settings' => array(
				'enabled'  => true,
				'template' => 'dois',
			),
		);
	}

	/**
	 * Saving re-points the shared attachment at the post's current generated image, so a
	 * template change doesn't leave the previous template's image attached to the post.
	 */
	public function test_saving_repoints_a_stale_sig_attachment() {
		$this->connect_blog();
		$this->set_social_options(
			$this->sig_options(
				'sig',
				array(
					array(
						'id'   => 0,
						'url'  => 'https://jetpack.com/redirect/?source=sigenerate&query=t%3Dold-token',
						'type' => 'image/png',
					),
				)
			)
		);

		$this->save_post();

		$attached_media = $this->get_attached_media();
		$this->assertStringContainsString( 'generated-token', $attached_media[0]['url'] );
		$this->assertSame( 0, $attached_media[0]['id'] );
		$this->assertSame( 'image/png', $attached_media[0]['type'] );
	}

	/**
	 * Media attached from the library is real content and must never be replaced.
	 */
	public function test_saving_leaves_library_media_alone() {
		$attachment = array(
			'id'   => 42,
			'url'  => 'https://example.com/photo.jpg',
			'type' => 'image/jpeg',
		);

		$this->connect_blog();
		$this->set_social_options( $this->sig_options( 'sig', array( $attachment ) ) );

		$this->save_post();

		$this->assertSame( array( $attachment ), $this->get_attached_media() );
	}

	/**
	 * A post sharing something other than the generated image is left untouched.
	 */
	public function test_saving_ignores_other_media_sources() {
		$attachment = array(
			'id'   => 0,
			'url'  => 'https://example.com/stale.png',
			'type' => 'image/png',
		);

		$this->connect_blog();
		$this->set_social_options( $this->sig_options( 'featured-image', array( $attachment ) ) );

		$this->save_post();

		$this->assertSame( array( $attachment ), $this->get_attached_media() );
	}

	/**
	 * A post that shares no media does not gain an attachment.
	 */
	public function test_saving_does_not_attach_media_to_a_post_without_any() {
		$this->connect_blog();
		$this->set_social_options( $this->sig_options( 'sig', array() ) );

		$this->save_post();

		$this->assertSame( array(), $this->get_attached_media() );
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
