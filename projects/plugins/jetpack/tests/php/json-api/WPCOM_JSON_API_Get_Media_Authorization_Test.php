<?php
/**
 * Tests for who can read what through the media GET JSON API endpoints.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api.php';
require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for who can read what through the media GET JSON API endpoints.
 *
 * @covers \WPCOM_JSON_API_Get_Media_Endpoint
 * @covers \WPCOM_JSON_API_Get_Media_v1_1_Endpoint
 * @covers \WPCOM_JSON_API_Get_Media_v1_2_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Get_Media_Endpoint::class )]
#[CoversClass( WPCOM_JSON_API_Get_Media_v1_1_Endpoint::class )]
#[CoversClass( WPCOM_JSON_API_Get_Media_v1_2_Endpoint::class )]
class WPCOM_JSON_API_Get_Media_Authorization_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A non-public post type with page capabilities, registered here so the test does
	 * not depend on another package.
	 */
	const PRIVATE_CPT = 'jp_test_private_cpt';

	/**
	 * Author who owns the fixtures.
	 *
	 * @var int
	 */
	private static $author_id;

	/**
	 * Contributor user ID. A contributor holds `edit_posts` but not `upload_files`.
	 *
	 * @var int
	 */
	private static $contributor_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$author_id      = $factory->user->create( array( 'role' => 'author' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		self::$subscriber_id  = $factory->user->create( array( 'role' => 'subscriber' ) );
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

		$_SERVER['REQUEST_METHOD'] = 'GET';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';

		register_post_type(
			self::PRIVATE_CPT,
			array(
				'public'          => false,
				'capability_type' => 'page',
				'map_meta_cap'    => true,
				'supports'        => array( 'title', 'editor' ),
			)
		);

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		unregister_post_type( self::PRIVATE_CPT );
		WPCOM_JSON_API::init()->token_details = array();

		parent::tear_down();
	}

	/**
	 * Build a minimal endpoint instance for direct callback testing.
	 *
	 * @param string $class Endpoint class name.
	 * @return object
	 */
	private function make_endpoint( $class ) {
		return new $class(
			array(
				'description' => '',
				'group'       => '__do_not_document',
				'stat'        => 'test',
				'method'      => 'GET',
				'path'        => '/sites/%s/media/%d',
				'path_labels' => array(
					'$site'     => '(int|string) Site ID or domain',
					'$media_ID' => '(int) The ID of the media item',
				),
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
				'post_content'   => 'Attachment description',
				'post_mime_type' => 'image/jpeg',
				'post_type'      => 'attachment',
				'post_author'    => $author_id,
			)
		);
	}

	/**
	 * Run the endpoint callback for the given class and media ID.
	 *
	 * @param string $class    Endpoint class name.
	 * @param int    $media_id Media ID to request.
	 * @return object|WP_Error
	 */
	private function get_media( $class, $media_id ) {
		global $blog_id;

		return $this->make_endpoint( $class )->callback( sprintf( '/sites/%d/media/%d', $blog_id, $media_id ), $blog_id, $media_id );
	}

	/**
	 * Assert a response is the `unknown_media` 404.
	 *
	 * @param mixed $response Endpoint response.
	 */
	private function assert_unknown_media( $response ) {
		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unknown_media', $response->get_error_code() );
		$this->assertSame( 404, $response->get_error_data() );
	}

	/**
	 * Endpoint classes serving `GET /sites/%s/media/%d`.
	 *
	 * @return array
	 */
	public static function media_endpoint_classes() {
		return array(
			'v1'   => array( WPCOM_JSON_API_Get_Media_Endpoint::class ),
			'v1.1' => array( WPCOM_JSON_API_Get_Media_v1_1_Endpoint::class ),
			'v1.2' => array( WPCOM_JSON_API_Get_Media_v1_2_Endpoint::class ),
		);
	}

	/**
	 * Every endpoint version crossed with post types that are not attachments.
	 *
	 * @return array
	 */
	public static function non_attachment_fixtures() {
		$cases = array();

		foreach ( self::media_endpoint_classes() as $version => $args ) {
			foreach ( array( 'draft_post', 'page', 'revision', 'private_cpt' ) as $kind ) {
				$cases[ "$version / $kind" ] = array( $args[0], $kind );
			}
		}

		return $cases;
	}

	/**
	 * Create one of the fixtures named by non_attachment_fixtures().
	 *
	 * @param string $kind Fixture name.
	 * @return int
	 */
	private function create_non_attachment( $kind ) {
		switch ( $kind ) {
			case 'draft_post':
				return self::factory()->post->create(
					array(
						'post_author'  => self::$author_id,
						'post_status'  => 'draft',
						'post_title'   => 'Unpublished title',
						'post_content' => 'NON-MEDIA-CONTENT',
					)
				);
			case 'page':
				return self::factory()->post->create(
					array(
						'post_author'  => self::$author_id,
						'post_type'    => 'page',
						'post_title'   => 'A page',
						'post_content' => 'NON-MEDIA-CONTENT',
					)
				);
			case 'revision':
				$parent_id = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
				return self::factory()->post->create(
					array(
						'post_type'    => 'revision',
						'post_status'  => 'inherit',
						'post_parent'  => $parent_id,
						'post_author'  => self::$author_id,
						'post_content' => 'NON-MEDIA-CONTENT',
					)
				);
			case 'private_cpt':
				return self::factory()->post->create(
					array(
						'post_author'  => self::$author_id,
						'post_type'    => self::PRIVATE_CPT,
						'post_title'   => 'Private entry',
						'post_content' => 'NON-MEDIA-CONTENT',
					)
				);
		}

		$this->fail( "Unknown fixture: $kind" );
	}

	/**
	 * Contributors hold `edit_posts` without `upload_files` and are intended callers here,
	 * so they must keep read access to the media library.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_contributor_can_read_an_attachment( $class ) {
		$attachment_id = $this->create_attachment( self::$author_id );
		wp_set_current_user( self::$contributor_id );

		$this->assertFalse( current_user_can( 'upload_files' ), 'A contributor must not hold upload_files.' );

		$response = $this->get_media( $class, $attachment_id );

		$this->assertNotWPError( $response );
		$this->assertSame( 'Attachment description', $response->description );
	}

	/**
	 * A caller without `edit_posts` is still refused outright.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_subscriber_cannot_read_media( $class ) {
		$attachment_id = $this->create_attachment( self::$author_id );
		wp_set_current_user( self::$subscriber_id );

		$response = $this->get_media( $class, $attachment_id );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );
	}

	/**
	 * A media ID that resolves to no post keeps returning the endpoint's own 404, so the
	 * post-type test must not turn a missing item into an authorization failure.
	 *
	 * @param string $class Endpoint class name.
	 *
	 * @dataProvider media_endpoint_classes
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'media_endpoint_classes' )]
	public function test_unknown_media_is_still_a_404( $class ) {
		wp_set_current_user( self::$contributor_id );

		$this->assert_unknown_media( $this->get_media( $class, PHP_INT_MAX ) );
	}

	/**
	 * Posts of any other type are reported as unknown media.
	 *
	 * @param string $class Endpoint class name.
	 * @param string $kind  Fixture name.
	 *
	 * @dataProvider non_attachment_fixtures
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'non_attachment_fixtures' )]
	public function test_non_attachments_are_refused( $class, $kind ) {
		$post_id = $this->create_non_attachment( $kind );
		wp_set_current_user( self::$contributor_id );

		$this->assertTrue( current_user_can( 'edit_posts', $post_id ), 'The caller must hold edit_posts for this fixture.' );

		$response = $this->get_media( $class, $post_id );

		$this->assert_unknown_media( $response );
		$this->assertStringNotContainsString( 'NON-MEDIA-CONTENT', wp_json_encode( $response, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * A non-public post type the caller cannot edit is reported as unknown media too.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_private_post_type_is_reported_as_unknown_media() {
		$post_id = self::factory()->post->create(
			array(
				'post_author'  => self::$author_id,
				'post_type'    => self::PRIVATE_CPT,
				'post_title'   => 'Private entry',
				'post_content' => 'Entry from 203.0.113.9',
			)
		);

		wp_set_current_user( self::$contributor_id );

		$this->assertFalse( current_user_can( 'edit_post', $post_id ), 'The caller must lack edit_pages on the fixture.' );

		$response = $this->get_media( WPCOM_JSON_API_Get_Media_v1_1_Endpoint::class, $post_id );

		$this->assert_unknown_media( $response );
		$this->assertStringNotContainsString( '203.0.113.9', wp_json_encode( $response, JSON_UNESCAPED_SLASHES ) );
	}

	/**
	 * The permission check is shared, so pin it directly as well as through the callbacks.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_permission_check_passes_missing_posts_through() {
		wp_set_current_user( self::$contributor_id );

		$endpoint = $this->make_endpoint( WPCOM_JSON_API_Get_Media_v1_1_Endpoint::class );

		$this->assertTrue( $endpoint->check_media_item_read_permission( $this->create_attachment( self::$author_id ) ) );
		$this->assertTrue( $endpoint->check_media_item_read_permission( PHP_INT_MAX ) );
	}
}
