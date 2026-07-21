<?php
/**
 * Tests for WPCOM_JSON_API_Update_Media_v1_1_Endpoint.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for the `ai_generated` flag on the media update endpoint.
 *
 * @covers \WPCOM_JSON_API_Update_Media_v1_1_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_Update_Media_v1_1_Endpoint::class )]
class WPCOM_JSON_API_Update_Media_v1_1_Endpoint_Test extends WP_UnitTestCase { // phpcs:ignore PEAR.NamingConventions.ValidClassName.Invalid, Generic.Classes.OpeningBraceSameLine.ContentAfterBrace -- matches source class naming.
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * AI-generated provenance postmeta key.
	 */
	const AI_GENERATED_META_KEY = '_wpcom_image_studio_ai_generated';

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Attachment ID.
	 *
	 * @var int
	 */
	private static $attachment_id;

	/**
	 * Create fixtures once before the class runs.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$attachment_id = $factory->post->create(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'image/png',
				'post_title'     => 'AI generated image',
				'post_author'    => self::$admin_user_id,
			)
		);
		// Give the attachment a file path so get_media_item_v1_1() doesn't call
		// basename( null ) while building its response for this fixture.
		update_post_meta( self::$attachment_id, '_wp_attached_file', 'ai-generated-image.png' );
	}

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'POST';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
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

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );

		wp_set_current_user( self::$admin_user_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		delete_post_meta( self::$attachment_id, self::AI_GENERATED_META_KEY );

		WPCOM_JSON_API::init()->token_details = array();

		parent::tear_down();
	}

	/**
	 * Feed a JSON body to the endpoint's input() reader.
	 *
	 * @param array $input Request body.
	 */
	private function set_input( $input ) {
		WPCOM_JSON_API::init()->post_body    = wp_json_encode( $input, JSON_UNESCAPED_SLASHES );
		WPCOM_JSON_API::init()->content_type = 'application/json';
	}

	/**
	 * Build the endpoint under test.
	 *
	 * @return WPCOM_JSON_API_Update_Media_v1_1_Endpoint
	 */
	private function get_endpoint() {
		return new WPCOM_JSON_API_Update_Media_v1_1_Endpoint(
			array(
				'description'    => 'Edit basic information about a media item.',
				'group'          => 'media',
				'stat'           => 'media:1:POST',
				'min_version'    => '1.1',
				'max_version'    => '1.1',
				'method'         => 'POST',
				'path'           => '/sites/%s/media/%d',
				'path_labels'    => array(
					'$site'     => '(int|string) Site ID or domain',
					'$media_ID' => '(int) The ID of the media item',
				),
				'request_format' => array(
					'title'        => '(string) The file name.',
					'ai_generated' => '(bool) Flag the attachment as AI-generated.',
				),
			)
		);
	}

	/**
	 * A truthy `ai_generated` flag records the AI provenance postmeta.
	 */
	public function test_ai_generated_flag_sets_postmeta() {
		global $blog_id;

		$this->set_input( array( 'ai_generated' => true ) );
		$response = $this->get_endpoint()->callback( '', $blog_id, self::$attachment_id );

		$this->assertNotWPError( $response );
		$this->assertNotEmpty(
			get_post_meta( self::$attachment_id, self::AI_GENERATED_META_KEY, true ),
			'A truthy ai_generated flag must set the provenance postmeta.'
		);
	}

	/**
	 * A request without the flag leaves the AI provenance postmeta untouched.
	 */
	public function test_absent_flag_leaves_postmeta_unset() {
		global $blog_id;

		$this->set_input( array( 'title' => 'Just a title' ) );
		$response = $this->get_endpoint()->callback( '', $blog_id, self::$attachment_id );

		$this->assertNotWPError( $response );
		$this->assertEmpty(
			get_post_meta( self::$attachment_id, self::AI_GENERATED_META_KEY, true ),
			'Requests without ai_generated must not set the provenance postmeta.'
		);
	}
}
