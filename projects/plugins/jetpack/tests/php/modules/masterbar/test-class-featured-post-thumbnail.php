<?php
/**
 * Test_Featured_Post_Thumbnail file.
 * Test Featured_Post_Thumbnail.
 *
 *  @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

require_jetpack_file( 'modules/masterbar/featured-post-thumbnail/class-featured-post-thumbnail.php' );
require_jetpack_file( 'tests/php/modules/masterbar/data/featured-image-post-thumbnail.php' );

/**
 * Class Test_Featured_Post_Thumbnail
 */
class Test_Featured_Post_Thumbnail extends \WP_UnitTestCase {

	/**
	 * The attachment holds file object.
	 *
	 * @var null
	 */
	public static $attachment = null;

	/**
	 * The get attachment endpoint response.
	 *
	 * @var \WP_Error|\WP_HTTP_Response|\WP_REST_Response|null
	 */
	public static $response = null;

	/**
	 * Create shared attachment.
	 *
	 * @param \WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		$attachment_id = $factory->attachment->create_upload_object( __DIR__ . '/data/files/dummy-file.jpg' );

		self::$attachment = get_post( $attachment_id );
	}

	/**
	 * Clean up attachment created.
	 */
	public static function tearDownAfterClass() {
		parent::tearDownAfterClass();

		wp_delete_attachment( self::$attachment->ID );
	}

	/**
	 * Setup attachment response fixture.
	 */
	public function setUp() {
		parent::setUp();

		self::$response = build_attachment_response_fixture( self::$attachment->ID );
	}

	/**
	 * Check if it returns original response if specific key doesn't exists.
	 */
	public function test_it_return_response_as_it_is_if_there_is_no_media_details() {
		$instance = new Featured_Post_Thumbnail();

		self::$response->data['media_details'] = false;

		$response = $instance->force_add_featured_post_thumbnail_image_support( self::$response, self::$attachment );

		$this->assertSame( self::$response, $response );
		$this->assertFalse( $response->data['media_details'] );
	}

	/**
	 * Check if returns original response if `post-thumbnail` key exists.
	 */
	public function test_it_return_response_as_it_is_if_size_exists() {
		$instance = new Featured_Post_Thumbnail();

		self::$response->data['media_details']['sizes']['post-thumbnail'] = array(
			'file'      => 'dummy-file-5-400x300.jpg',
			'width'     => 400,
			'height'    => 300,
			'mime-type' => 'image/jpeg',
		);

		$response = $instance->force_add_featured_post_thumbnail_image_support( self::$response, self::$attachment );

		$this->assertSame( self::$response, $response );
		$this->assertArrayHasKey( 'post-thumbnail', $response->data['media_details']['sizes'] );
	}

	/**
	 * Check it adds target image type to the response if it doesn't exists.
	 */
	public function test_it_add_post_thumbnail_image_if_size_doesnt_exists() {
		$instance = new Featured_Post_Thumbnail();

		unset( self::$response->data['media_details']['sizes']['post-thumbnail'] );

		$response = $instance->force_add_featured_post_thumbnail_image_support( self::$response, self::$attachment );

		$this->assertArrayHasKey( 'post-thumbnail', $response->data['media_details']['sizes'] );
	}

	/**
	 * Check if returns original response if attachment is invalid.
	 */
	public function test_it_return_response_as_it_is_if_attachment_is_invalid() {
		$instance = new Featured_Post_Thumbnail();

		$invalid_attachment = new \WP_Post( new \stdClass() );

		$invalid_attachment->ID = 99999;

		$response = $instance->force_add_featured_post_thumbnail_image_support( self::$response, $invalid_attachment );

		$this->assertSame( self::$response, $response );
	}

	/**
	 * Check if returns original response if attachment is null.
	 */
	public function test_it_return_response_as_it_is_if_attachment_is_null() {
		$instance = new Featured_Post_Thumbnail();

		$response = $instance->force_add_featured_post_thumbnail_image_support( self::$response, null );

		$this->assertSame( self::$response, $response );
	}
}
