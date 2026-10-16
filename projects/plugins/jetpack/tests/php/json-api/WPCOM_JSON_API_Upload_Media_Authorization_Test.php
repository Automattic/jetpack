<?php
/**
 * Per-target authorization tests for the media upload JSON API endpoint.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Per-target authorization tests for `POST /sites/%s/media/new`.
 *
 * The endpoint gates on `upload_files`, which says the caller may upload something but
 * never where they may put it. `attrs[i]['parent_id']` names the post an upload is
 * attached to, and attaching is an edit of that post.
 *
 * These live in their own file rather than in
 * `WPCOM_JSON_API_Media_Endpoints_Authorization_Test`: this is a different endpoint class
 * with a different `request_format` and a callback that takes no media ID, so the fixtures
 * there do not fit.
 *
 * @covers \WPCOM_JSON_API_Upload_Media_v1_1_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Upload_Media_v1_1_Endpoint::class )]
class WPCOM_JSON_API_Upload_Media_Authorization_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Author doing the uploading.
	 *
	 * @var int
	 */
	private static $uploader_id;

	/**
	 * A second author, whose posts the uploader may not edit.
	 *
	 * @var int
	 */
	private static $other_author_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	private static $editor_id;

	/**
	 * URLs the endpoint was asked to fetch during the test.
	 *
	 * @var string[]
	 */
	private $fetched = array();

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$uploader_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$other_author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_id       = $factory->user->create( array( 'role' => 'editor' ) );
	}

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		parent::set_up();

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		add_filter( 'pre_http_request', array( $this, 'serve_image' ), 10, 3 );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'serve_image' ) );

		WPCOM_JSON_API::init()->token_details = array();
		WPCOM_JSON_API::init()->post_body     = null;
		WPCOM_JSON_API::init()->content_type  = null;

		parent::tear_down();
	}

	/**
	 * Serve real image bytes for any sideload, and record that the fetch happened.
	 *
	 * `download_url()` streams to `$parsed_args['filename']`, so a short-circuited request
	 * has to write the file itself. The bytes must be a real image: `handle_media_sideload()`
	 * runs the result through `file_is_displayable_image()`, so junk fails for the wrong
	 * reason and the assertions stop discriminating.
	 *
	 * @param bool   $preempt     Whether to preempt the request.
	 * @param array  $parsed_args Request arguments.
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function serve_image( $preempt, $parsed_args, $url ) {
		$this->fetched[] = $url;

		if ( ! empty( $parsed_args['filename'] ) ) {
			file_put_contents( $parsed_args['filename'], file_get_contents( __DIR__ . '/../files/jetpack.jpg' ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions
		}

		return array(
			'headers'  => array(),
			'body'     => '',
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => $parsed_args['filename'] ?? null,
		);
	}

	/**
	 * Build the upload endpoint, declaring the fields the callback reads.
	 *
	 * `input()` runs the body through `cast_and_filter()` against `request_format`, so a
	 * field the fixture does not declare never reaches the callback.
	 *
	 * @return WPCOM_JSON_API_Upload_Media_v1_1_Endpoint
	 */
	private function make_endpoint() {
		return new WPCOM_JSON_API_Upload_Media_v1_1_Endpoint(
			array(
				'description'    => '',
				'group'          => '__do_not_document',
				'stat'           => 'test',
				'method'         => 'POST',
				'path'           => '/sites/%s/media/new',
				'path_labels'    => array(
					'$site' => '(int|string) Site ID or domain',
				),
				'request_format' => array(
					'media_urls' => '(array) An array of URLs to upload.',
					'attrs'      => '(array) An array of attributes to assign.',
				),
			)
		);
	}

	/**
	 * Set the request input for the API endpoint.
	 *
	 * @param array $input Input data.
	 */
	private function set_input( $input ) {
		WPCOM_JSON_API::init()->post_body    = wp_json_encode( $input, JSON_UNESCAPED_SLASHES );
		WPCOM_JSON_API::init()->content_type = 'application/json';
	}

	/**
	 * Invoke the endpoint with the given media URLs and attributes.
	 *
	 * @param array $media_urls Media URLs.
	 * @param array $attrs      Per-item attributes.
	 * @return mixed
	 */
	private function upload( $media_urls, $attrs ) {
		global $blog_id;

		$this->set_input(
			array(
				'media_urls' => $media_urls,
				'attrs'      => $attrs,
			)
		);

		return $this->make_endpoint()->callback( sprintf( '/sites/%d/media/new', $blog_id ), $blog_id );
	}

	/**
	 * Count the attachments on the site, to prove a refusal created nothing.
	 *
	 * @return int
	 */
	private function attachment_count() {
		return count(
			get_posts(
				array(
					'post_type'   => 'attachment',
					'post_status' => 'any',
					'fields'      => 'ids',
					'numberposts' => -1,
				)
			)
		);
	}

	/**
	 * `upload_files` does not authorize attaching an upload to someone else's post.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_upload_rejects_a_parent_id_the_user_cannot_edit() {
		$target_id = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		wp_set_current_user( self::$uploader_id );

		$this->assertTrue( current_user_can( 'upload_files' ), 'The caller must pass the endpoint gate.' );
		$this->assertFalse( current_user_can( 'edit_post', $target_id ), 'The caller must not be able to edit the target.' );

		$before   = $this->attachment_count();
		$response = $this->upload( array( 'https://example.com/one.jpg' ), array( array( 'parent_id' => $target_id ) ) );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );

		// The refusal has to come before any work: nothing fetched, nothing created.
		$this->assertSame( array(), $this->fetched, 'The gate must reject before any remote fetch.' );
		$this->assertSame( $before, $this->attachment_count(), 'No attachment may be created.' );
	}

	/**
	 * A batch is refused whole. One unauthorized target rejects the request rather than
	 * uploading the rest, because the endpoint creates items one at a time and a partial
	 * batch would leave the earlier ones behind with no way to retry cleanly.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_upload_refuses_the_whole_batch_when_one_target_is_unauthorized() {
		$own_id   = self::factory()->post->create( array( 'post_author' => self::$uploader_id ) );
		$other_id = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		wp_set_current_user( self::$uploader_id );

		$before   = $this->attachment_count();
		$response = $this->upload(
			array( 'https://example.com/one.jpg', 'https://example.com/two.jpg' ),
			array(
				array( 'parent_id' => $own_id ),
				array( 'parent_id' => $other_id ),
			)
		);

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( array(), $this->fetched, 'The authorized item must not be uploaded either.' );
		$this->assertSame( $before, $this->attachment_count(), 'No attachment may be created.' );
	}

	/**
	 * Uploading onto a post the caller may edit still works.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_upload_allows_a_parent_id_the_user_can_edit() {
		$target_id = self::factory()->post->create( array( 'post_author' => self::$uploader_id ) );

		wp_set_current_user( self::$uploader_id );

		$response = $this->upload( array( 'https://example.com/one.jpg' ), array( array( 'parent_id' => $target_id ) ) );

		$this->assertNotWPError( $response );
		$this->assertCount( 1, $this->fetched );

		$media = get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'any',
				'post_parent' => $target_id,
				'fields'      => 'ids',
				'numberposts' => -1,
			)
		);

		$this->assertCount( 1, $media, 'The upload must be attached to the target.' );
	}

	/**
	 * An upload with no `parent_id` is unaffected: it names no target, so there is nothing
	 * to authorize.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_upload_without_a_parent_id_still_works() {
		wp_set_current_user( self::$uploader_id );

		$before   = $this->attachment_count();
		$response = $this->upload( array( 'https://example.com/one.jpg' ), array() );

		$this->assertNotWPError( $response );
		$this->assertSame( $before + 1, $this->attachment_count() );
	}

	/**
	 * An upload-token request has `parent_id` dropped, not refused: the upload succeeds and
	 * the item lands unattached.
	 *
	 * Such a request runs with no logged-in user by construction — WPCOM's
	 * `is_authorized_with_upload_token()` returns false as soon as `get_current_user_id()`
	 * is non-zero — so it can never demonstrate `edit_post` on any target. Refusing would
	 * break any client pairing a token with `parent_id` and buy nothing: dropping reaches
	 * the same `post_parent` 0 the check already treats as safe.
	 *
	 * The token is not trusted here. It is an opaque bearer credential mintable by any
	 * logged-in user via `/sites/%s/media/token`, so it must not buy an attach.
	 *
	 * The monorepo stub always returns false, so the token arm has to be forced to reach
	 * this at all.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_upload_token_request_drops_the_parent_id() {
		global $blog_id;

		$target_id = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		// No logged-in user, exactly as an upload-token request runs.
		wp_set_current_user( 0 );
		$this->assertFalse( current_user_can( 'edit_post', $target_id ), 'A userless request can never pass edit_post.' );

		$endpoint      = $this->make_endpoint();
		$endpoint->api = new class() extends WPCOM_JSON_API {
			/**
			 * Stand in for the WPCOM implementation, which the monorepo stubs to false.
			 *
			 * @return bool
			 */
			public function is_authorized_with_upload_token() {
				return true;
			}
		};

		// The endpoint reads its body from its own API object, not from the singleton.
		$endpoint->api->token_details = array( 'blog_id' => $blog_id );
		$endpoint->api->post_body     = wp_json_encode(
			array(
				'media_urls' => array( 'https://example.com/one.jpg' ),
				'attrs'      => array( array( 'parent_id' => $target_id ) ),
			),
			JSON_UNESCAPED_SLASHES
		);
		$endpoint->api->content_type  = 'application/json';

		$response = $endpoint->callback( sprintf( '/sites/%d/media/new', $blog_id ), $blog_id );

		$this->assertNotWPError( $response, 'A token upload must not be refused.' );
		$this->assertCount( 1, $this->fetched, 'The upload must proceed.' );

		$attached = get_posts(
			array(
				'post_type'   => 'attachment',
				'post_status' => 'any',
				'post_parent' => $target_id,
				'fields'      => 'ids',
				'numberposts' => -1,
			)
		);

		$this->assertSame( array(), $attached, 'The token must not buy an attach to the target.' );
	}

	/**
	 * Editors may attach uploads to other users' posts, because they may edit those posts.
	 * Pins that the check follows `edit_post` rather than authorship.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_editor_may_upload_onto_another_users_post() {
		$target_id = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		wp_set_current_user( self::$editor_id );

		$response = $this->upload( array( 'https://example.com/one.jpg' ), array( array( 'parent_id' => $target_id ) ) );

		$this->assertNotWPError( $response );
		$this->assertCount( 1, $this->fetched );
	}
}
