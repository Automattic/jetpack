<?php
/**
 * Tests for the jetpack_videopress_import REST field on /wp/v2/media:
 * flag-gated registration, presence on import draft placeholders with the
 * meta blob resolved (local thumbnail preferred over the remote URL), and
 * removal from non-draft attachments.
 *
 * Lives in the sqlite suite (tests/php-sqlite) because the field is read off
 * real attachment posts served by the core media controller. Like the other
 * suites here, this deliberately does NOT extend WorDBless\BaseTestCase: its
 * teardown instantiates the dbless module singletons, whose hooks would
 * corrupt real sqlite inserts in later tests.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_REST_Request;
use WP_REST_Server;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test suite for the WPCOM_REST_API_V2_Attachment_VideoPress_Import_Data class.
 */
class Attachment_VideoPress_Import_Data_Test extends TestCase {

	const FIELD = 'jetpack_videopress_import';

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Attachment IDs created during the current test.
	 *
	 * @var int[]
	 */
	private $attachment_ids = array();

	/**
	 * Set up before each test.
	 */
	protected function set_up() {
		parent::set_up();

		if ( ! defined( 'DB_ENGINE' ) || 'sqlite' !== constant( 'DB_ENGINE' ) ) {
			$this->markTestSkipped( 'Import field tests need real attachment posts; run them via the sqlite test suite (composer phpunit).' );
		}
	}

	/**
	 * Clean up after each test: attachments, filters, the REST server, and
	 * the core controllers rest_api_init cached on the post type objects
	 * (see Import_Rest_Controller_Test for why the latter matters).
	 */
	protected function tear_down() {
		foreach ( $this->attachment_ids as $attachment_id ) {
			wp_delete_attachment( $attachment_id, true );
		}
		$this->attachment_ids = array();

		remove_all_filters( Admin_UI::STUDIO_FILTER );

		// register_fields() writes straight into this global; scrub it so the
		// field's presence never leaks between tests.
		global $wp_rest_additional_fields;
		unset( $wp_rest_additional_fields['attachment'][ self::FIELD ] );

		global $wp_rest_server;
		$wp_rest_server = null;

		foreach ( get_post_types( array(), 'objects' ) as $post_type_object ) {
			$post_type_object->rest_controller = null;
		}

		wp_cache_flush();

		parent::tear_down();
	}

	/**
	 * Create a fresh REST server, construct the field class (its internal
	 * should_register() gate mirrors the Initializer), and fire rest_api_init.
	 *
	 * @return WP_REST_Server
	 */
	private function initialize_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		new WPCOM_REST_API_V2_Attachment_VideoPress_Import_Data();
		do_action( 'rest_api_init' );

		return $wp_rest_server;
	}

	/**
	 * Create an attachment post and track it for cleanup.
	 *
	 * @param string $mime_type The post_mime_type.
	 * @param array  $meta      Post meta key => value pairs.
	 * @return int The attachment ID.
	 */
	private function create_attachment( $mime_type, $meta = array() ) {
		$attachment_id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_parent'    => 0,
				'post_mime_type' => $mime_type,
				'post_title'     => 'Import field test attachment',
			),
			true
		);
		$this->assertIsInt( $attachment_id );
		$this->attachment_ids[] = $attachment_id;

		foreach ( $meta as $key => $value ) {
			update_post_meta( $attachment_id, $key, $value );
		}

		return $attachment_id;
	}

	/**
	 * The import meta blob the Import_Rest_Controller stores on placeholders.
	 *
	 * @param array $overrides Blob keys to override.
	 * @return array The meta blob.
	 */
	private function import_blob( $overrides = array() ) {
		return array_merge(
			array(
				'source'                  => 'youtube',
				'external_id'             => 'Zt8vWy2RbQ4',
				'title'                   => 'Sunrise Timelapse Over Lake Titicaca (4K)',
				'description'             => 'Three hours compressed into three minutes.',
				'tags'                    => array( 'timelapse', '4k' ),
				'duration_seconds'        => 187,
				'privacy'                 => 'public',
				'published_at'            => '2026-04-29T11:30:00Z',
				'thumbnail_url'           => 'https://i.ytimg.com/vi/Zt8vWy2RbQ4/hqdefault.jpg',
				'thumbnail_attachment_id' => 0,
			),
			$overrides
		);
	}

	/**
	 * GET /wp/v2/media/{id} through the test server.
	 *
	 * @param int $attachment_id The attachment ID.
	 * @return \WP_REST_Response The response.
	 */
	private function get_media_item( $attachment_id ) {
		return $this->server->dispatch( new WP_REST_Request( 'GET', '/wp/v2/media/' . $attachment_id ) );
	}

	/** Tests that the field does not register while the Studio flag is off. */
	public function test_field_not_registered_when_studio_flag_off() {
		$this->initialize_rest_server();

		$attachment_id = $this->create_attachment(
			Import_Rest_Controller::DRAFT_MIME_TYPE,
			array(
				Import_Rest_Controller::META_IMPORT        => $this->import_blob(),
				Import_Rest_Controller::META_IMPORT_STATUS => Import_Rest_Controller::STATUS_AWAITING_MEDIA,
			)
		);

		$response = $this->get_media_item( $attachment_id );
		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( self::FIELD, $response->get_data() );
	}

	/** Tests that a draft placeholder exposes the import blob plus its status. */
	public function test_draft_placeholder_exposes_import_data() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		$this->initialize_rest_server();

		$attachment_id = $this->create_attachment(
			Import_Rest_Controller::DRAFT_MIME_TYPE,
			array(
				Import_Rest_Controller::META_IMPORT        => $this->import_blob(),
				Import_Rest_Controller::META_IMPORT_STATUS => Import_Rest_Controller::STATUS_AWAITING_MEDIA,
			)
		);

		$response = $this->get_media_item( $attachment_id );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( self::FIELD, $data );

		$import = $data[ self::FIELD ];
		$this->assertSame( 'youtube', $import['source'] );
		$this->assertSame( 'Zt8vWy2RbQ4', $import['external_id'] );
		$this->assertSame( 'Sunrise Timelapse Over Lake Titicaca (4K)', $import['title'] );
		$this->assertSame( 'Three hours compressed into three minutes.', $import['description'] );
		$this->assertSame( array( 'timelapse', '4k' ), $import['tags'] );
		$this->assertSame( 187, $import['duration_seconds'] );
		$this->assertSame( 'public', $import['privacy'] );
		$this->assertSame( '2026-04-29T11:30:00Z', $import['published_at'] );
		// No sideloaded copy (thumbnail_attachment_id 0) → the remote URL.
		$this->assertSame( 'https://i.ytimg.com/vi/Zt8vWy2RbQ4/hqdefault.jpg', $import['thumbnail_url'] );
		$this->assertSame( 0, $import['thumbnail_attachment_id'] );
		$this->assertSame( Import_Rest_Controller::STATUS_AWAITING_MEDIA, $import['status'] );
	}

	/** Tests that a sideloaded local thumbnail wins over the stored remote URL. */
	public function test_thumbnail_url_prefers_sideloaded_local_copy() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		$this->initialize_rest_server();

		$thumbnail_id = $this->create_attachment( 'image/jpeg' );
		update_post_meta( $thumbnail_id, '_wp_attached_file', '2026/06/sunrise-thumb.jpg' );

		$attachment_id = $this->create_attachment(
			Import_Rest_Controller::DRAFT_MIME_TYPE,
			array(
				Import_Rest_Controller::META_IMPORT        => $this->import_blob( array( 'thumbnail_attachment_id' => $thumbnail_id ) ),
				Import_Rest_Controller::META_IMPORT_STATUS => Import_Rest_Controller::STATUS_AWAITING_MEDIA,
			)
		);

		$response = $this->get_media_item( $attachment_id );
		$import   = $response->get_data()[ self::FIELD ];
		$this->assertSame( $thumbnail_id, $import['thumbnail_attachment_id'] );
		// No intermediate sizes exist, so 'large' falls back to the full file.
		$this->assertStringEndsWith( '2026/06/sunrise-thumb.jpg', $import['thumbnail_url'] );
		$this->assertStringNotContainsString( 'ytimg.com', $import['thumbnail_url'] );
	}

	/** Tests that non-draft attachments do not carry the field even with the flag on. */
	public function test_field_removed_for_non_draft_attachments() {
		add_filter( Admin_UI::STUDIO_FILTER, '__return_true' );
		$this->initialize_rest_server();

		$video_id = $this->create_attachment( 'video/videopress' );
		$image_id = $this->create_attachment( 'image/jpeg' );

		foreach ( array( $video_id, $image_id ) as $attachment_id ) {
			$response = $this->get_media_item( $attachment_id );
			$this->assertSame( 200, $response->get_status() );
			$this->assertArrayNotHasKey( self::FIELD, $response->get_data() );
		}
	}
}
