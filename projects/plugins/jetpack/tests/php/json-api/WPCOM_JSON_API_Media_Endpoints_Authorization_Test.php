<?php
/**
 * Per-object authorization tests for the media edit/update JSON API endpoints.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Per-object authorization tests for the media edit/update JSON API endpoints.
 *
 * @covers \WPCOM_JSON_API_Update_Media_Endpoint
 * @covers \WPCOM_JSON_API_Update_Media_v1_1_Endpoint
 * @covers \WPCOM_JSON_API_Edit_Media_v1_2_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Update_Media_Endpoint::class )]
#[CoversClass( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class )]
#[CoversClass( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class )]
class WPCOM_JSON_API_Media_Endpoints_Authorization_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Author who owns the attachment under test.
	 *
	 * @var int
	 */
	private static $owner_id;

	/**
	 * A second author, with no rights over the attachment under test.
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
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Contributor user ID. A contributor holds `edit_posts` but not `upload_files`.
	 *
	 * @var int
	 */
	private static $contributor_id;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$owner_id        = $factory->user->create( array( 'role' => 'author' ) );
		self::$other_author_id = $factory->user->create( array( 'role' => 'author' ) );
		self::$editor_id       = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_id   = $factory->user->create( array( 'role' => 'subscriber' ) );
		self::$contributor_id  = $factory->user->create( array( 'role' => 'contributor' ) );
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
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		WPCOM_JSON_API::init()->token_details = array();
		WPCOM_JSON_API::init()->post_body     = null;
		WPCOM_JSON_API::init()->content_type  = null;

		parent::tear_down();
	}

	/**
	 * Build a minimal endpoint instance for direct callback testing.
	 *
	 * The request format matters: `input()` runs the body through `cast_and_filter()`
	 * against it, so a field the fixture does not declare is dropped before the callback
	 * ever sees it. v1.2 therefore gets its own `media` / `media_url` / `attrs` fields —
	 * without them the file-replacement branch is unreachable from a test.
	 *
	 * @param string $class Endpoint class name.
	 * @return object
	 */
	private function make_endpoint( $class ) {
		$request_format = array(
			'title'       => '(string) The file name.',
			'caption'     => '(string) File caption.',
			'description' => '(HTML) Description of the file.',
			'parent_id'   => '(int) ID of the post this media is attached to',
		);
		$path           = '/sites/%s/media/%d';

		if ( is_a( $class, WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class, true ) ) {
			$request_format['media']     = '(media) An object file to attach to the post.';
			$request_format['media_url'] = '(string) An URL of the image to attach to a post.';
			$request_format['attrs']     = '(object) An Object of attributes to assign to the media uploaded via `media` or `media_url`.';
			$path                        = '/sites/%s/media/%d/edit';
		}

		return new $class(
			array(
				'description'    => '',
				'group'          => '__do_not_document',
				'stat'           => 'test',
				'method'         => 'POST',
				'path'           => $path,
				'path_labels'    => array(
					'$site'     => '(int|string) Site ID or domain',
					'$media_ID' => '(int) The ID of the media item',
				),
				'request_format' => $request_format,
			)
		);
	}

	/**
	 * Create an attachment owned by the given user.
	 *
	 * @param int $author_id Attachment author.
	 * @return int
	 */
	private function create_attachment( $author_id ) {
		return self::factory()->attachment->create_object(
			array(
				'file'           => 'image.jpg',
				'post_parent'    => 0,
				'post_title'     => 'Original title',
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => $author_id,
			)
		);
	}

	/**
	 * Create an attachment owned by the given user, backed by a real file on disk, so a
	 * test can assert the bytes were left alone.
	 *
	 * @param int $author_id Attachment author.
	 * @return array{0:int,1:string} Attachment ID and the absolute path of its file.
	 */
	private function create_attachment_with_file( $author_id ) {
		$upload = wp_upload_bits( 'media-authorization-original.jpg', null, 'ORIGINAL-BYTES' );
		$this->assertFalse( $upload['error'], 'Fixture upload failed.' );

		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => $upload['file'],
				'post_parent'    => 0,
				'post_title'     => 'Original title',
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => $author_id,
			)
		);

		return array( $attachment_id, $upload['file'] );
	}

	/**
	 * Invoke the protected current_user_can_edit_media_item() method.
	 *
	 * @param object $endpoint Endpoint instance.
	 * @param int    $media_id Media ID to check.
	 * @return bool
	 */
	private function invoke_can_edit( $endpoint, $media_id ) {
		$method = ( new ReflectionClass( $endpoint ) )->getMethod( 'current_user_can_edit_media_item' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $endpoint, $media_id );
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
	 * Endpoint classes exposing the per-object check.
	 *
	 * @return array
	 */
	public static function media_endpoint_classes() {
		return array(
			'v1'   => array( WPCOM_JSON_API_Update_Media_Endpoint::class ),
			'v1.1' => array( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class ),
			'v1.2' => array( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class ),
		);
	}

	/**
	 * The attachment author may edit their own media.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_owner_can_edit_own_media( $class ) {
		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$owner_id );

		$this->assertTrue( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * Another author holding `upload_files` may not edit someone else's media.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_other_author_cannot_edit_media( $class ) {
		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$other_author_id );

		$this->assertTrue( current_user_can( 'upload_files' ) );
		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * Editors keep access to media uploaded by other users.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_editor_can_edit_other_users_media( $class ) {
		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$editor_id );

		$this->assertTrue( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * Users without `upload_files` remain rejected.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_subscriber_cannot_edit_media( $class ) {
		$attachment_id = $this->create_attachment( self::$subscriber_id );
		wp_set_current_user( self::$subscriber_id );

		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * A userless request gets no exemption from the per-object check: `upload_files`
	 * alone must never authorize editing a caller-supplied media ID.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_userless_request_with_upload_files_is_denied( $class ) {
		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( 0 );

		$grant_upload = function ( $allcaps ) {
			$allcaps['upload_files'] = true;
			return $allcaps;
		};
		add_filter( 'user_has_cap', $grant_upload );

		$can_edit = $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id );

		remove_filter( 'user_has_cap', $grant_upload );

		$this->assertFalse( $can_edit, 'User 0 must not be exempt from the per-object check.' );
	}

	/**
	 * `upload_files` is load-bearing on its own, not merely a duplicate of `edit_post`.
	 *
	 * Every other denial in this file also fails `edit_post`, so nothing pins the first
	 * arm of the check. A Contributor who authored an attachment is the case that
	 * separates them: `map_meta_cap` maps `edit_post` on an `inherit`-status attachment
	 * they own down to `edit_posts`, which a Contributor holds, while `upload_files` is
	 * not in the role at all. Dropping the `upload_files` arm would let them through.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_contributor_authoring_media_still_needs_upload_files( $class ) {
		$attachment_id = $this->create_attachment( self::$contributor_id );
		wp_set_current_user( self::$contributor_id );

		$this->assertFalse( current_user_can( 'upload_files' ), 'Contributors must not hold upload_files.' );
		$this->assertTrue( current_user_can( 'edit_post', $attachment_id ), 'A Contributor may edit a post they authored.' );

		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * Media with no author (`post_author` 0, e.g. inserted by an import, a sideload
	 * or an upload-token request) is editable by Editors and above only. `map_meta_cap`
	 * treats a falsy `post_author` as "not yours" and requires `edit_others_posts`.
	 * Deliberate: trunk let any Author edit these, core's own media endpoints do not.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_ownerless_media_is_editable_by_editors_only( $class ) {
		$attachment_id = $this->create_attachment( 0 );
		$this->assertSame( 0, (int) get_post( $attachment_id )->post_author );

		wp_set_current_user( self::$owner_id );
		$this->assertTrue( current_user_can( 'upload_files' ) );
		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );

		wp_set_current_user( self::$editor_id );
		$this->assertTrue( $this->invoke_can_edit( $this->make_endpoint( $class ), $attachment_id ) );
	}

	/**
	 * Unknown media still resolves to the endpoint's own 404 rather than a 403.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_unknown_media_passes_the_capability_gate( $class ) {
		wp_set_current_user( self::$owner_id );

		$this->assertTrue( $this->invoke_can_edit( $this->make_endpoint( $class ), 999999 ) );
	}

	/**
	 * The helper's missing-post passthrough only pays off if the callback then produces the
	 * endpoint's own 404, so pin that end to end rather than at the helper alone: an unknown
	 * ID must come back `unknown_media` / 404, never `unauthorized` / 403.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_callback_returns_the_endpoint_404_for_unknown_media( $class ) {
		global $blog_id;

		$media_id = 999999;
		$this->assertNull( get_post( $media_id ), 'Fixture ID must not exist.' );

		wp_set_current_user( self::$owner_id );
		$this->assertTrue( current_user_can( 'upload_files' ) );

		$endpoint = $this->make_endpoint( $class );
		$this->set_input( array( 'title' => 'Should not matter' ) );

		// $endpoint->path already carries the '/edit' suffix for v1.2.
		$response = $endpoint->callback( sprintf( $endpoint->path, $blog_id, $media_id ), $blog_id, $media_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unknown_media', $response->get_error_code() );
		$this->assertSame( 404, $response->get_error_data() );
	}

	/**
	 * V1.1: another author cannot rename someone else's attachment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_rejects_other_users_media() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$other_author_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'title' => 'Hijacked' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 'Original title', get_post( $attachment_id )->post_title );
	}

	/**
	 * V1: another author cannot rename someone else's attachment.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_callback_rejects_other_users_media() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$other_author_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_Endpoint::class );
		$this->set_input( array( 'title' => 'Hijacked' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 'Original title', get_post( $attachment_id )->post_title );
	}

	/**
	 * V1.2: another author cannot reach the file-replacement path.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_2_callback_rejects_other_users_media() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$other_author_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class );
		$this->set_input( array( 'media_url' => 'https://example.com/replacement.jpg' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d/edit', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
	}

	/**
	 * V1.2: another author cannot replace the bytes of someone else's attachment.
	 *
	 * This is the case `test_v1_2_callback_rejects_other_users_media()` cannot cover.
	 * That test only asserts the error, and the v1.1 parent `callback()` — which v1.2
	 * calls at the end — raises the same `unauthorized` error from its own copy of the
	 * gate. Remove v1.2's gate and the request still comes back `unauthorized`, after
	 * the file has already been fetched and written. So the error assertion alone says
	 * nothing about the early guard.
	 *
	 * Uses the real v1.2 file-replacement shape (`media_url` plus `attrs`, the pairing
	 * `update_by_attrs_parameter()` requires) and asserts the side effects instead: no
	 * outbound fetch, the bytes on disk untouched, `attrs` not applied, and no
	 * revision-history snapshot recorded.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_2_callback_rejects_file_replacement_by_other_user() {
		global $blog_id;

		list( $attachment_id, $file ) = $this->create_attachment_with_file( self::$owner_id );
		$original_hash                = md5_file( $file );

		wp_set_current_user( self::$other_author_id );

		/*
		 * The mock must write real image bytes to $parsed_args['filename']. `download_url()`
		 * streams to that path, so a short-circuited `pre_http_request` has to produce the
		 * file itself; and `save_temporary_file()` runs the result through
		 * `is_file_supported_for_sideloading()` / `file_is_displayable_image()`, so junk
		 * bytes bail out with `invalid_input` before anything is replaced. Either mistake
		 * makes the replacement fail for the wrong reason and the assertions below stop
		 * discriminating. Do not "simplify" this to a bodiless mock.
		 */
		$replacement = file_get_contents( __DIR__ . '/../files/jetpack.jpg' );
		$fetched     = array();
		$intercept   = function ( $preempt, $parsed_args, $url ) use ( &$fetched, $replacement ) {
			$fetched[] = $url;
			if ( ! empty( $parsed_args['filename'] ) ) {
				file_put_contents( $parsed_args['filename'], $replacement );
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
		};
		add_filter( 'pre_http_request', $intercept, 10, 3 );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class );
		$this->set_input(
			array(
				'media_url' => 'https://example.com/replacement.jpg',
				'attrs'     => array(
					'title'   => 'Hijacked',
					'caption' => 'Hijacked caption',
				),
			)
		);

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d/edit', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		remove_filter( 'pre_http_request', $intercept );

		/*
		 * Side effects first: these are what the early gate actually buys, and asserting
		 * them before the error shape keeps a failure pointing at the security property.
		 *
		 * The replacement sideloads to a *new* path and repoints the attachment rather than
		 * overwriting the original file, so the hash has to follow `get_attached_file()`.
		 * Hashing the original path instead would pass either way and prove nothing.
		 */
		$this->assertSame( array(), $fetched, 'The gate must reject before any remote fetch is attempted.' );
		$this->assertFileExists( $file );
		$this->assertSame( $file, get_attached_file( $attachment_id ), 'The attachment must not be repointed at a replacement file.' );
		$this->assertSame( $original_hash, md5_file( get_attached_file( $attachment_id ) ), 'The bytes this attachment resolves to must be unchanged.' );
		$this->assertSame( 'Original title', get_post( $attachment_id )->post_title, '`attrs` must not be applied.' );
		$this->assertSame( '', get_post( $attachment_id )->post_excerpt, '`attrs` must not be applied.' );
		$this->assertSame( '', get_post_meta( $attachment_id, Jetpack_Media::WP_ORIGINAL_MEDIA, true ), 'No revision snapshot must be recorded.' );

		// Note this pair is *not* what pins the early gate: v1.2 ends with
		// `parent::callback()`, and the v1.1 parent raises the same `unauthorized` error
		// from its own copy of the check. It stays for the error shape, nothing more.
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
	}

	/**
	 * V1.2: the attachment author can still rename their own media, so the tightened
	 * gate has not broken the legitimate path.
	 *
	 * Uses `title` rather than `attrs`: `update_by_attrs_parameter()` only runs when a
	 * media file or URL is supplied alongside it, so with neither the v1.2 callback
	 * falls through to the v1.1 parent, which is what applies `title`.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_2_callback_allows_owner() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class );
		$this->set_input( array( 'title' => 'Renamed by owner via v1.2' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d/edit', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( 'Renamed by owner via v1.2', get_post( $attachment_id )->post_title );
	}

	/**
	 * V1.1: the attachment author can still rename their own media.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_allows_owner() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'title' => 'Renamed by owner' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( 'Renamed by owner', get_post( $attachment_id )->post_title );
	}

	/**
	 * An ordinary post is not media, so the media endpoints must refuse it even when the
	 * caller may edit it. `get_post()` resolves any post type, and `get_media_item()` only
	 * 404s on a *missing* post, so the post-type test is the only thing standing between
	 * these endpoints and the whole posts table.
	 *
	 * The `edit_post` assertion is what gives this test its teeth: the caller passes every
	 * other arm of the gate, so a failure here can only mean the post-type test is gone.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_ordinary_post_is_not_editable_as_media( $class ) {
		$post_id = self::factory()->post->create( array( 'post_author' => self::$owner_id ) );
		wp_set_current_user( self::$owner_id );

		$this->assertTrue( current_user_can( 'upload_files' ) );
		$this->assertTrue( current_user_can( 'edit_post', $post_id ), 'The caller must otherwise pass the gate.' );

		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $post_id ) );
	}

	/**
	 * A revision is not media either, and it is the sharper case: `map_meta_cap` maps
	 * `edit_post` on a revision to its parent, so a caller who may edit the parent passes
	 * the capability arm. Only the post-type test rejects it.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_revision_is_not_editable_as_media( $class ) {
		$post_id     = self::factory()->post->create( array( 'post_author' => self::$owner_id ) );
		$revision_id = self::factory()->post->create(
			array(
				'post_type'   => 'revision',
				'post_status' => 'inherit',
				'post_parent' => $post_id,
				'post_author' => self::$owner_id,
			)
		);

		wp_set_current_user( self::$owner_id );

		$this->assertTrue( current_user_can( 'edit_post', $revision_id ), 'edit_post on a revision maps to its parent.' );

		$this->assertFalse( $this->invoke_can_edit( $this->make_endpoint( $class ), $revision_id ) );
	}

	/**
	 * V1.1 end to end: an ordinary post comes back 403 and is left untouched, rather than
	 * being renamed through a media endpoint.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_rejects_an_ordinary_post() {
		global $blog_id;

		$post_id = self::factory()->post->create(
			array(
				'post_author' => self::$owner_id,
				'post_title'  => 'Original post title',
			)
		);
		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'title' => 'Renamed through the media endpoint' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $post_id ), $blog_id, $post_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );
		$this->assertSame( 'Original post title', get_post( $post_id )->post_title );
	}

	/**
	 * V1.1: `parent_id` names a post to attach the media to, which is an edit of that post.
	 * A caller who may edit their own attachment must not be able to hang it off a post they
	 * cannot edit.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_rejects_parent_id_the_user_cannot_edit() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		$target_id     = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		wp_set_current_user( self::$owner_id );

		$this->assertTrue( current_user_can( 'edit_post', $attachment_id ), 'The caller owns the attachment.' );
		$this->assertFalse( current_user_can( 'edit_post', $target_id ), 'The caller must not be able to edit the target.' );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input(
			array(
				'title'     => 'Renamed',
				'parent_id' => $target_id,
			)
		);

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );

		// The whole update is refused, not just the parent field.
		$this->assertSame( 0, (int) get_post( $attachment_id )->post_parent );
		$this->assertSame( 'Original title', get_post( $attachment_id )->post_title );
	}

	/**
	 * V1.2 reaches the same `parent_id` handling through `parent::callback()`, so pin it
	 * there too — the v1.2 route is registered from v1 up to v1.2.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_2_callback_rejects_parent_id_the_user_cannot_edit() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		$target_id     = self::factory()->post->create( array( 'post_author' => self::$other_author_id ) );

		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Edit_Media_v1_2_Endpoint::class );
		$this->set_input( array( 'parent_id' => $target_id ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d/edit', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 0, (int) get_post( $attachment_id )->post_parent );
	}

	/**
	 * V1.1: attaching media to a post the caller may edit still works.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_allows_parent_id_the_user_can_edit() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		$target_id     = self::factory()->post->create( array( 'post_author' => self::$owner_id ) );

		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'parent_id' => $target_id ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( $target_id, (int) get_post( $attachment_id )->post_parent );
	}

	/**
	 * V1.1: a `parent_id` naming a post that does not exist is refused, for every role.
	 * `edit_post` maps to `do_not_allow` on a missing post, so this 403s administrators
	 * too. Intended: trunk wrote the dangling `post_parent` instead. A trashed target
	 * still passes, since the post is there to check.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_rejects_a_parent_id_that_does_not_exist() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		$missing_id    = 999999;

		$this->assertNull( get_post( $missing_id ), 'Fixture ID must not exist.' );

		wp_set_current_user( self::$editor_id );
		$this->assertFalse( current_user_can( 'edit_post', $missing_id ), 'edit_post fails closed on a missing post.' );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'parent_id' => $missing_id ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );
		$this->assertSame( 0, (int) get_post( $attachment_id )->post_parent );
	}

	/**
	 * V1.1: a trashed target is still a post the caller may edit, so re-parenting to it
	 * keeps working. Pins the boundary of the missing-post rejection above.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_allows_a_trashed_parent_id() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		$target_id     = self::factory()->post->create( array( 'post_author' => self::$owner_id ) );
		wp_trash_post( $target_id );

		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'parent_id' => $target_id ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( $target_id, (int) get_post( $attachment_id )->post_parent );
	}

	/**
	 * V1.1: `parent_id` 0 detaches the item. It names no target, and `edit_post` fails
	 * closed on 0, so it must stay exempt from the target check or detaching becomes
	 * impossible.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_allows_detaching_media() {
		global $blog_id;

		$target_id     = self::factory()->post->create( array( 'post_author' => self::$owner_id ) );
		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => 'image.jpg',
				'post_parent'    => $target_id,
				'post_title'     => 'Original title',
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => self::$owner_id,
			)
		);

		wp_set_current_user( self::$owner_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'parent_id' => 0 ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( 0, (int) get_post( $attachment_id )->post_parent );
	}

	/**
	 * V1.1: editors can still rename media uploaded by someone else.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_v1_1_callback_allows_editor() {
		global $blog_id;

		$attachment_id = $this->create_attachment( self::$owner_id );
		wp_set_current_user( self::$editor_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class );
		$this->set_input( array( 'title' => 'Renamed by editor' ) );

		$response = $endpoint->callback( sprintf( '/sites/%d/media/%d', $blog_id, $attachment_id ), $blog_id, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( 'Renamed by editor', get_post( $attachment_id )->post_title );
	}
}
